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
	"net/http"
	"strings"

	"github.com/emicklei/go-restful/v3"
	"k8s.io/klog/v2"

	"github.com/kubevela/velaux/pkg/server/utils"
)

// Gzip static file compression
func Gzip(req *http.Request, res http.ResponseWriter, chain *utils.FilterChain) {
	doCompress, encoding := wantsCompressedResponse(req, res)
	if doCompress {
		w, err := restful.NewCompressingResponseWriter(res, encoding)
		if err != nil {
			klog.Errorf("failed to create the compressing writer, err: %s", err.Error())
			res.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer func() {
			if err = w.Close(); err != nil {
				klog.Errorf("failed to close the compressing writer, err: %s", err.Error())
			}
		}()
		chain.ProcessFilter(req, w)
		return
	}
	chain.ProcessFilter(req, res)
}

// WantsCompressedResponse reads the Accept-Encoding header to see if and which encoding is requested.
// It also inspects the httpWriter whether its content-encoding is already set (non-empty).
func wantsCompressedResponse(httpRequest *http.Request, httpWriter http.ResponseWriter) (bool, string) {
	if contentEncoding := httpWriter.Header().Get(restful.HEADER_ContentEncoding); contentEncoding != "" {
		return false, ""
	}
	header := httpRequest.Header.Get(restful.HEADER_AcceptEncoding)
	gi := strings.Index(header, restful.ENCODING_GZIP)
	zi := strings.Index(header, restful.ENCODING_DEFLATE)
	// use in order of appearance
	if gi == -1 {
		return zi != -1, restful.ENCODING_DEFLATE
	}
	if zi == -1 {
		return gi != -1, restful.ENCODING_GZIP
	}
	if gi < zi {
		return true, restful.ENCODING_GZIP
	}
	return true, restful.ENCODING_DEFLATE
}
