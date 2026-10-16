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
	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	"github.com/emicklei/go-restful/v3"

	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// pkg is the API for the CUE packages a definition can import. Like the
// definitions API it asks for a signed-in user and no permission: it reads
// what definitions are written against, and changes nothing.
type pkg struct {
	PackageService service.PackageService `inject:""`
}

// NewPackage is the API for the CUE packages a definition can import.
func NewPackage() Interface {
	return &pkg{}
}

func (p *pkg) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/packages").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for the CUE packages a definition can import")

	tags := []string{"package"}

	ws.Route(ws.GET("/").To(p.list).
		Doc("list the Package resources in the cluster and the packages built into KubeVela").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.ListPackagesResponse{}).
		Writes(apis.ListPackagesResponse{}))

	ws.Route(ws.GET("/builtin").To(p.builtin).
		Doc("detail a package built into KubeVela, by its path and what imports it").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Param(ws.QueryParameter("path", "the path it is imported as, e.g. vela/kube").DataType("string").Required(true)).
		Param(ws.QueryParameter("variant", "what imports it, as the list gives it").DataType("string").Required(true)).
		Returns(200, "OK", apis.PackageDetail{}).
		Returns(404, "Not Found", bcode.Bcode{}).
		Writes(apis.PackageDetail{}))

	ws.Route(ws.GET("/{namespace}/{name}").To(p.detail).
		Doc("detail a Package resource").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Param(ws.PathParameter("namespace", "the Package's namespace").DataType("string")).
		Param(ws.PathParameter("name", "the Package's name").DataType("string")).
		Returns(200, "OK", apis.PackageDetail{}).
		Returns(404, "Not Found", bcode.Bcode{}).
		Writes(apis.PackageDetail{}))

	return ws
}

func (p *pkg) list(req *restful.Request, res *restful.Response) {
	packages, err := p.PackageService.ListPackages(req.Request.Context())
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(apis.ListPackagesResponse{Packages: packages}); err != nil {
		bcode.ReturnError(req, res, err)
	}
}

func (p *pkg) detail(req *restful.Request, res *restful.Response) {
	detail, err := p.PackageService.DetailPackage(req.Request.Context(), req.PathParameter("namespace"), req.PathParameter("name"))
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(detail); err != nil {
		bcode.ReturnError(req, res, err)
	}
}

func (p *pkg) builtin(req *restful.Request, res *restful.Response) {
	detail, err := p.PackageService.DetailBuiltinPackage(req.Request.Context(), req.QueryParameter("path"), req.QueryParameter("variant"))
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(detail); err != nil {
		bcode.ReturnError(req, res, err)
	}
}
