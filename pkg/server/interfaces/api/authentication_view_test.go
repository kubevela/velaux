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
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/form3tech-oss/jwt-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kubevela/velaux/pkg/server/domain/model"
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

func TestViewAuthentication(t *testing.T) {
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
