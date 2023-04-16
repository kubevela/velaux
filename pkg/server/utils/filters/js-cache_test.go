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

package filters

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/emicklei/go-restful/v3"
	"github.com/stretchr/testify/assert"

	"github.com/kubevela/velaux/pkg/server/utils"
)

func TestJSCache(t *testing.T) {
	chain := utils.NewFilterChain(loadJS, JSCache)
	res1 := httptest.NewRecorder()
	u, err := url.Parse("/test.js?v=1")
	assert.Equal(t, err, nil)
	chain.ProcessFilter(&http.Request{Method: "GET", URL: u}, res1)
	assert.Equal(t, res1.Code, 200)
	assert.Equal(t, res1.Body.String(), jsContent)
	assert.Equal(t, res1.HeaderMap.Get(HeaderHitCache), "false")
	assert.Equal(t, jsFileCache.Len(), 1)
	data, ok := jsFileCache.Get(u.String())
	assert.Equal(t, ok, true)
	assert.Equal(t, data.(*cacheData).data.String(), jsContent)

	res2 := httptest.NewRecorder()
	chain = utils.NewFilterChain(loadJS, JSCache)
	chain.ProcessFilter(&http.Request{Method: "GET", URL: u}, res2)
	assert.Equal(t, res2.Code, 200)
	assert.Equal(t, res2.Body.String(), jsContent)

	assert.Equal(t, res2.HeaderMap.Get(HeaderHitCache), "true")

	u2, err := url.Parse("/test.js?v=2")
	assert.Equal(t, err, nil)
	res3 := httptest.NewRecorder()
	chain = utils.NewFilterChain(loadJS, JSCache)
	chain.ProcessFilter(&http.Request{Method: "GET", URL: u2}, res3)
	assert.Equal(t, res3.Code, 200)
	assert.Equal(t, res3.Body.String(), jsContent)
	assert.Equal(t, res3.HeaderMap.Get(HeaderHitCache), "false")
}

var jsContent = "console.log(\"hello\")"

func loadJS(req *http.Request, res http.ResponseWriter) {
	fmt.Printf("miss cache,path:%s \n", req.URL.String())
	res.WriteHeader(200)
	res.Write([]byte(jsContent))
	res.Header().Add(restful.HEADER_ContentType, "application/javascript")
}
