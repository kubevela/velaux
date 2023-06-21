/*
Copyright 2023 The KubeVela Authors.

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

package router

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/julienschmidt/httprouter"
	"github.com/stretchr/testify/assert"

	"github.com/kubevela/velaux/pkg/plugin/types"
)

func TestDefaultGenerateHTTPRouter(t *testing.T) {
	var res = &httptest.ResponseRecorder{}
	var req = &http.Request{Method: "GET", URL: &url.URL{Scheme: "http", Path: "/proxy/plugins/default-router/test", Host: "127.0.0.1"}}
	defaultRouter := GetPluginHandler(&types.Plugin{
		JSONData: types.JSONData{
			ID: "default-router",
		},
	}, func(w http.ResponseWriter, r1 *http.Request, p1 httprouter.Params, p2 *types.Plugin, r2 *types.Route) {
		if r1.URL.Path == "/proxy/plugins/default-router/test" {
			w.WriteHeader(403)
			return
		}
		w.WriteHeader(404)
	})
	defaultRouter.ServeHTTP(res, req)
	assert.Equal(t, res.Code, 403)
}

func TestRouteGenerateHTTPRouter(t *testing.T) {
	var req = &http.Request{Method: "GET", URL: &url.URL{Scheme: "http", Path: "/proxy/plugins/route-router/nodes/t", Host: "127.0.0.1"}}
	var reqMethodNotAllow = &http.Request{Method: "PUT", URL: &url.URL{Scheme: "http", Path: "/proxy/plugins/route-router/nodes/t", Host: "127.0.0.1"}}
	var req404 = &http.Request{Method: "GET", URL: &url.URL{Scheme: "http", Path: "/proxy/plugins/route-router/nodes", Host: "127.0.0.1"}}
	router := GetPluginHandler(&types.Plugin{
		JSONData: types.JSONData{
			ID: "route-router",
			Routes: []*types.Route{
				{
					Path:   "/nodes/:node",
					Method: "GET",
					ProxyHeaders: []types.Header{{
						Name:  "Authorization",
						Value: "Bearer test",
					}},
				},
			},
		},
	}, func(w http.ResponseWriter, r1 *http.Request, p1 httprouter.Params, p2 *types.Plugin, r2 *types.Route) {
		assert.Equal(t, p1.ByName("node"), "t")
		assert.Equal(t, len(r2.ProxyHeaders), 1)
		assert.Equal(t, r2.ProxyHeaders[0].Name, "Authorization")
		w.WriteHeader(200)
	})
	res := &httptest.ResponseRecorder{}
	router.ServeHTTP(res, req)
	assert.Equal(t, res.Code, 200)

	res = &httptest.ResponseRecorder{}
	router.ServeHTTP(res, req404)
	assert.Equal(t, res.Code, 404)

	res = &httptest.ResponseRecorder{}
	router.ServeHTTP(res, reqMethodNotAllow)
	assert.Equal(t, res.Code, 405)
}
