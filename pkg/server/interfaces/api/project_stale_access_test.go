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
)

// /projects/stale-access is the list of left-over access, not a project named so.
func TestStaleProjectAccessRoute(t *testing.T) {
	ws := (&project{RbacService: &permRecorder{}, RBACService: &permRecorder{}}).GetWebServiceRoute()
	for _, method := range []string{http.MethodGet, http.MethodDelete} {
		_, route, err := restful.CurlyRouter{}.SelectRoute([]*restful.WebService{ws},
			httptest.NewRequest(method, versionPrefix+"/projects/stale-access", nil))
		assert.NoError(t, err)
		assert.Equal(t, versionPrefix+"/projects/stale-access", route.Path, method)
	}
}
