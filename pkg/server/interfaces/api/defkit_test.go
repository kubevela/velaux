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

	"github.com/emicklei/go-restful/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kubevela/velaux/pkg/server/domain/service"
)

// permRecorder records whether a permission check ran.
type permRecorder struct {
	service.RBACService
	checked bool
}

func (p *permRecorder) CheckPerm(string, ...string) func(req *restful.Request, res *restful.Response, chain *restful.FilterChain) {
	return func(req *restful.Request, res *restful.Response, chain *restful.FilterChain) {
		p.checked = true
		chain.ProcessFilter(req, res)
	}
}

// /defkit/repositories is the list of repositories, not a module named so.
func TestDefKitRepositoriesRoute(t *testing.T) {
	d := &defkit{RbacService: &permRecorder{}}
	ws := d.GetWebServiceRoute()
	_, route, err := restful.CurlyRouter{}.SelectRoute([]*restful.WebService{ws},
		httptest.NewRequest(http.MethodGet, versionPrefix+"/defkit/repositories", nil))
	assert.NoError(t, err)
	assert.Equal(t, versionPrefix+"/defkit/repositories", route.Path)

	_, route, err = restful.CurlyRouter{}.SelectRoute([]*restful.WebService{ws},
		httptest.NewRequest(http.MethodGet, versionPrefix+"/defkit/vela-policies", nil))
	assert.NoError(t, err)
	assert.Equal(t, versionPrefix+"/defkit/{name}", route.Path, "any other name is a module")
}

// A permission check reads the user the token names, so the token is checked first.
func TestDefKitAuthenticatesBeforePermissions(t *testing.T) {
	perms := &permRecorder{}
	d := &defkit{RbacService: perms}
	container := restful.NewContainer()
	container.Add(d.GetWebServiceRoute())

	res := httptest.NewRecorder()
	container.ServeHTTP(res, httptest.NewRequest(http.MethodGet, versionPrefix+"/defkit", nil))
	assert.Equal(t, http.StatusUnauthorized, res.Code)
	assert.False(t, perms.checked, "a request without a token never reaches the permission check")
}

// permsRecorder records each permission a request is checked for.
type permsRecorder struct {
	service.RBACService
	checked []string
}

func (p *permsRecorder) CheckPerm(resource string, actions ...string) func(req *restful.Request, res *restful.Response, chain *restful.FilterChain) {
	return func(req *restful.Request, res *restful.Response, chain *restful.FilterChain) {
		p.checked = append(p.checked, resource+":"+strings.Join(actions, ","))
		chain.ProcessFilter(req, res)
	}
}

// A module writes global definitions, so changing one takes the definition
// permission as well as the DefKit one.
func TestDefKitWritesNeedTheDefinitionPermission(t *testing.T) {
	for _, tc := range []struct {
		method, path string
		want         []string
	}{
		{http.MethodGet, "/defkit/defs", []string{"defkit:detail"}},
		{http.MethodPost, "/defkit", []string{"defkit:create", "definition:create"}},
		{http.MethodPut, "/defkit/defs", []string{"defkit:update", "definition:update"}},
		{http.MethodPost, "/defkit/defs/apply", []string{"defkit:update", "definition:create", "definition:update", "definition:delete"}},
		{http.MethodDelete, "/defkit/defs", []string{"defkit:delete", "definition:delete"}},
	} {
		perms := &permsRecorder{}
		ws := (&defkit{RbacService: perms}).GetWebServiceRoute()
		req := httptest.NewRequest(tc.method, versionPrefix+tc.path, nil)
		req.Header.Set("Content-Type", restful.MIME_JSON)
		_, route, err := restful.CurlyRouter{}.SelectRoute([]*restful.WebService{ws}, req)
		require.NoError(t, err, tc.method+" "+tc.path)
		chain := &restful.FilterChain{Filters: route.Filters, Target: func(*restful.Request, *restful.Response) {}}
		chain.ProcessFilter(restful.NewRequest(httptest.NewRequest(tc.method, versionPrefix+tc.path, nil)), restful.NewResponse(httptest.NewRecorder()))
		assert.Equal(t, tc.want, perms.checked, tc.method+" "+tc.path)
	}
}
