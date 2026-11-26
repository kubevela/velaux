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
	"reflect"
	"regexp"
	"sort"
	"strings"
	"testing"

	"github.com/emicklei/go-restful/v3"
	"github.com/stretchr/testify/assert"

	"github.com/kubevela/velaux/pkg/server/domain/service"
)

// publicRoutes answer without a token, each for a reason a signed-out user needs it.
var publicRoutes = map[string]string{
	"POST /api/v1/auth/login":           "signing in",
	"GET /api/v1/auth/login_type":       "the sign-in page chooses local or Dex sign-in",
	"GET /api/v1/auth/dex_config":       "the sign-in page redirects to Dex",
	"GET /api/v1/auth/admin_configured": "the sign-in page offers first-run admin setup",
	"PUT /api/v1/auth/init_admin":       "first-run admin setup, refused once an admin exists",
	"GET /api/v1/auth/refresh_token":    "authenticated by the refresh token it carries",
	"GET /api/v1/customisation/":        "the sign-in page shows the branding",
	"POST /api/v1/webhook/{token}":      "authenticated by the token in its path",
}

var pathParam = regexp.MustCompile(`\{[^}]+\}`)

// withPermAsker fills every RBACService field of an API with permAsker, so building its routes
// does not dereference a service the test does not set up.
func withPermAsker(api Interface) Interface {
	v := reflect.ValueOf(api)
	if v.Kind() != reflect.Ptr || v.Elem().Kind() != reflect.Struct {
		return api
	}
	rbac := reflect.TypeOf((*service.RBACService)(nil)).Elem()
	s := v.Elem()
	for i := 0; i < s.NumField(); i++ {
		f := s.Field(i)
		if f.Type() == rbac && f.CanSet() {
			f.Set(reflect.ValueOf(permAsker{}))
		}
	}
	return api
}

// Every route refuses a request without a token, except the public ones.
func TestEveryRouteRequiresAuthentication(t *testing.T) {
	InitAPIBean()
	var open []string
	for _, api := range GetRegisteredAPI() {
		ws := withPermAsker(api).GetWebServiceRoute()
		container := restful.NewContainer()
		container.DoNotRecover(false)
		container.Add(ws)
		for _, route := range ws.Routes() {
			key := route.Method + " " + route.Path
			req := httptest.NewRequest(route.Method, pathParam.ReplaceAllString(route.Path, "x"), strings.NewReader("{}"))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()
			container.ServeHTTP(rec, req)
			if rec.Code != http.StatusUnauthorized {
				if _, public := publicRoutes[key]; !public {
					open = append(open, key)
				}
			}
		}
	}
	sort.Strings(open)
	assert.Empty(t, open, "routes that answer without a token")
}
