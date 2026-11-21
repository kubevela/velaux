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
	"strings"
	"testing"
	"time"

	"github.com/emicklei/go-restful/v3"
	"github.com/stretchr/testify/assert"

	"github.com/kubevela/velaux/pkg/server/domain/service"
)

// permAsker answers a route's permission check with the resource and
// actions it asks for, and goes no further.
type permAsker struct {
	service.RBACService
}

func (permAsker) CheckPerm(resource string, actions ...string) func(*restful.Request, *restful.Response, *restful.FilterChain) {
	return func(_ *restful.Request, res *restful.Response, _ *restful.FilterChain) {
		res.AddHeader("X-Perm", resource+":"+strings.Join(actions, ","))
		res.WriteHeader(http.StatusNoContent)
	}
}

// permOf is the permission a request to ws asks for.
func permOf(t *testing.T, ws *restful.WebService, method, path string) string {
	t.Helper()
	container := restful.NewContainer()
	container.Add(ws)
	req := httptest.NewRequest(method, path, strings.NewReader("{}"))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken(t, "admin", time.Now().Add(time.Hour)))
	rec := httptest.NewRecorder()
	container.ServeHTTP(rec, req)
	return rec.Header().Get("X-Perm")
}

func TestConfigRoutesAskForTheirAction(t *testing.T) {
	project := (&project{RbacService: permAsker{}, RBACService: permAsker{}}).GetWebServiceRoute()
	global := (&config{RbacService: permAsker{}}).GetWebServiceRoute()
	for _, c := range []struct {
		ws           *restful.WebService
		method, path string
		want         string
	}{
		{project, http.MethodGet, "/api/v1/projects/shop/configs", "project/config:list"},
		{project, http.MethodGet, "/api/v1/projects/shop/configs/db", "project/config:detail"},
		{project, http.MethodGet, "/api/v1/projects/shop/config_templates/db", "project/config:detail"},
		{project, http.MethodPost, "/api/v1/projects/shop/configs", "project/config:create"},
		{project, http.MethodPut, "/api/v1/projects/shop/configs/db", "project/config:update"},
		{project, http.MethodDelete, "/api/v1/projects/shop/configs/db", "project/config:delete"},
		{project, http.MethodGet, "/api/v1/projects/shop/distributions", "project/config:list"},
		{global, http.MethodGet, "/api/v1/configs/db", "config:detail"},
	} {
		assert.Equal(t, c.want, permOf(t, c.ws, c.method, c.path), "%s %s", c.method, c.path)
	}
}
