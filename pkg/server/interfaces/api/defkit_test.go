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

	"github.com/emicklei/go-restful/v3"
	"github.com/stretchr/testify/assert"

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
