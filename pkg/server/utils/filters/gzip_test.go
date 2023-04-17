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
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/emicklei/go-restful/v3"
	"github.com/stretchr/testify/assert"

	"github.com/kubevela/velaux/pkg/server/utils"
)

func TestGZip(t *testing.T) {
	chain := utils.NewFilterChain(loadJS, Gzip)
	res1 := httptest.NewRecorder()
	u, err := url.Parse("/test.js?v=1")
	assert.Equal(t, err, nil)
	reqHeader := http.Header{}
	reqHeader.Set(restful.HEADER_AcceptEncoding, restful.ENCODING_GZIP)
	chain.ProcessFilter(&http.Request{Method: "GET", URL: u, Header: reqHeader}, res1)
	assert.Equal(t, res1.Code, 200)
	assert.Equal(t, res1.HeaderMap.Get(restful.HEADER_ContentEncoding), restful.ENCODING_GZIP)

	// Gzip decode
	reader, err := gzip.NewReader(res1.Body)
	assert.Equal(t, err, nil)
	body, err := io.ReadAll(reader)
	assert.Equal(t, err, nil)
	assert.Equal(t, string(body), jsContent)
}
