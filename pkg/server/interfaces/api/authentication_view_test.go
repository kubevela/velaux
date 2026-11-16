/*
Copyright 2026 The KubeVela Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/emicklei/go-restful/v3"
	"github.com/form3tech-oss/jwt-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// accessToken is an access token for user, signed as VelaUX signs them in a
// test, with an empty key.
func accessToken(t *testing.T, user string, expires time.Time) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, model.CustomClaims{
		StandardClaims: jwt.StandardClaims{NotBefore: time.Now().Unix(), ExpiresAt: expires.Unix(), Issuer: "vela-issuer"},
		Username:       user,
		GrantType:      "access",
	})
	signed, err := token.SignedString([]byte(""))
	require.NoError(t, err)
	return signed
}

// parsingSessions accepts any well-signed token of the right grant type, standing in for the
// datastore-backed check, except for the users it has ended the sessions of.
type parsingSessions struct {
	service.AuthenticationService
	ended map[string]bool
}

func (p parsingSessions) ValidateToken(_ context.Context, token, grantType string) (*model.CustomClaims, *model.User, error) {
	claims, err := service.ParseToken(token)
	if err != nil {
		return nil, nil, err
	}
	if claims.GrantType != grantType {
		return nil, nil, bcode.ErrNotAccessToken
	}
	if p.ended[claims.Username] {
		return nil, nil, bcode.ErrSessionEnded
	}
	return claims, &model.User{Name: claims.Username}, nil
}

func withSessions(t *testing.T, s service.AuthenticationService) {
	t.Helper()
	before := sessions
	sessions = s
	t.Cleanup(func() { sessions = before })
}

func TestEveryRequestChecksTheSession(t *testing.T) {
	withSessions(t, parsingSessions{ended: map[string]bool{"gone": true}})
	call := func(token string) (bool, *http.Request, *httptest.ResponseRecorder) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/applications", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		return authTokenCheck(req, rec), req, rec
	}

	ok, req, _ := call(accessToken(t, "admin", time.Now().Add(time.Hour)))
	require.True(t, ok)
	user, _ := req.Context().Value(&apis.CtxKeyUserModel).(*model.User)
	require.NotNil(t, user, "the user loaded for the check is handed on, so later filters need not read it again")
	assert.Equal(t, "admin", user.Name)

	ok, _, rec := call(accessToken(t, "gone", time.Now().Add(time.Hour)))
	assert.False(t, ok)
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	assert.Contains(t, rec.Body.String(), "12013")

	withSessions(t, nil)
	ok, _, _ = call(accessToken(t, "admin", time.Now().Add(time.Hour)))
	assert.False(t, ok, "with no session check wired, nothing is let through")
}

func TestViewAuthentication(t *testing.T) {
	withSessions(t, parsingSessions{})
	expires := time.Now().Add(time.Hour)
	token := accessToken(t, "admin", expires)

	t.Run("a view page opened with the token keeps it in a cookie for the page's own requests", func(t *testing.T) {
		rec := httptest.NewRecorder()
		ok := authTokenCheck(httptest.NewRequest(http.MethodGet, "/view/cloudshell?token="+token, nil), rec)
		require.True(t, ok)
		cookies := rec.Result().Cookies()
		require.Len(t, cookies, 1)
		c := cookies[0]
		assert.Equal(t, viewTokenCookie, c.Name)
		assert.Equal(t, token, c.Value)
		assert.Equal(t, "/view", c.Path)
		assert.True(t, c.HttpOnly)
		assert.Equal(t, http.SameSiteStrictMode, c.SameSite)
		assert.WithinDuration(t, expires, c.Expires, 2*time.Second, "it lasts as long as the token")
	})

	t.Run("a view page's own request is authenticated by the cookie", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/view/cloudshell/token", nil)
		req.AddCookie(&http.Cookie{Name: viewTokenCookie, Value: token})
		rec := httptest.NewRecorder()
		assert.True(t, authTokenCheck(req, rec))
		assert.Empty(t, rec.Result().Cookies(), "nothing new to keep")
	})

	t.Run("the cookie authenticates view pages only", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/applications", nil)
		req.AddCookie(&http.Cookie{Name: viewTokenCookie, Value: token})
		assert.False(t, authTokenCheck(req, httptest.NewRecorder()))
	})

	t.Run("a view request with neither is refused", func(t *testing.T) {
		assert.False(t, authTokenCheck(httptest.NewRequest(http.MethodGet, "/view/cloudshell/token", nil), httptest.NewRecorder()))
	})

	t.Run("a bad cookie is refused", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/view/cloudshell/token", nil)
		req.AddCookie(&http.Cookie{Name: viewTokenCookie, Value: "not-a-token"})
		assert.False(t, authTokenCheck(req, httptest.NewRecorder()))
	})
}

// loggingOut records whose sessions it ended.
type loggingOut struct {
	parsingSessions
	ended *[]string
}

func (l loggingOut) Logout(_ context.Context, username string) error {
	*l.ended = append(*l.ended, username)
	return nil
}

func TestLogoutTakesABarePost(t *testing.T) {
	var ended []string
	s := loggingOut{ended: &ended}
	withSessions(t, s)
	container := restful.NewContainer()
	container.Add((&authentication{AuthenticationService: s}).GetWebServiceRoute())
	for _, contentType := range []string{"", "application/json"} {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
		if contentType != "" {
			req.Header.Set("Content-Type", contentType)
		}
		req.Header.Set("Authorization", "Bearer "+accessToken(t, "admin", time.Now().Add(time.Hour)))
		rec := httptest.NewRecorder()
		container.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code, "content type %q: %s", contentType, rec.Body.String())
	}
	assert.Equal(t, []string{"admin", "admin"}, ended)
}
