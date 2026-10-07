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

// defkit is the API for DefKit definition modules. A module installs
// definitions, so it takes the definition permissions.
type defkit struct {
	DefKitService service.DefKitService `inject:""`
	RbacService   service.RBACService   `inject:""`
}

// NewDefKit is the API for DefKit definition modules.
func NewDefKit() Interface {
	return &defkit{}
}

func (d *defkit) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/defkit").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for DefKit definition modules (experimental)")

	tags := []string{"defkit"}
	name := ws.PathParameter("name", "the module's name").DataType("string")

	ws.Route(ws.GET("/").To(d.list).
		Doc("list the installed DefKit modules").
		Filter(d.RbacService.CheckPerm("definition", "list")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.ListDefKitModulesResponse{}).
		Writes(apis.ListDefKitModulesResponse{}))

	ws.Route(ws.GET("/repositories").To(d.repositories).
		Doc("the module sources the defkit addon offers when adding one").
		Filter(d.RbacService.CheckPerm("definition", "list")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.ListDefKitRepositoriesResponse{}).
		Writes(apis.ListDefKitRepositoriesResponse{}))

	ws.Route(ws.POST("/").To(d.create).
		Doc("install a DefKit module; its render waits for review").
		Filter(d.RbacService.CheckPerm("definition", "create")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Reads(apis.CreateDefKitModuleRequest{}).
		Returns(200, "OK", apis.DefKitModule{}).
		Returns(400, "Bad Request", bcode.Bcode{}).
		Writes(apis.DefKitModule{}))

	ws.Route(ws.GET("/{name}").To(d.detail).
		Doc("detail a DefKit module and the definitions it installed").
		Filter(d.RbacService.CheckPerm("definition", "detail")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Param(name).
		Returns(200, "OK", apis.DefKitModuleDetail{}).
		Returns(404, "Not Found", bcode.Bcode{}).
		Writes(apis.DefKitModuleDetail{}))

	ws.Route(ws.PUT("/{name}").To(d.update).
		Doc("change a DefKit module's source or settings; the new render waits for review unless it updates itself").
		Filter(d.RbacService.CheckPerm("definition", "update")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Param(name).
		Reads(apis.UpdateDefKitModuleRequest{}).
		Returns(200, "OK", apis.DefKitModule{}).
		Returns(404, "Not Found", bcode.Bcode{}).
		Writes(apis.DefKitModule{}))

	ws.Route(ws.DELETE("/{name}").To(d.remove).
		Doc("uninstall a DefKit module and the definitions it installed").
		Filter(d.RbacService.CheckPerm("definition", "delete")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Param(name).
		Returns(200, "OK", apis.EmptyResponse{}).
		Returns(404, "Not Found", bcode.Bcode{}).
		Writes(apis.EmptyResponse{}))

	ws.Route(ws.GET("/{name}/preview").To(d.preview).
		Doc("the module's pending render against the cluster").
		Filter(d.RbacService.CheckPerm("definition", "detail")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Param(name).
		Returns(200, "OK", apis.DefKitPreview{}).
		Returns(404, "Not Found", bcode.Bcode{}).
		Writes(apis.DefKitPreview{}))

	ws.Route(ws.POST("/{name}/apply").To(d.apply).
		Doc("apply the module's pending render: take over the conflicts named, delete the removed definitions named").
		Filter(d.RbacService.CheckPerm("definition", "update")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Param(name).
		Reads(apis.ApplyDefKitPreviewRequest{}).
		Returns(200, "OK", apis.EmptyResponse{}).
		Returns(400, "Bad Request", bcode.Bcode{}).
		Writes(apis.EmptyResponse{}))

	ws.Filter(authCheckFilter)
	return ws
}

func (d *defkit) list(req *restful.Request, res *restful.Response) {
	resp, err := d.DefKitService.ListModules(req.Request.Context())
	write(req, res, resp, err)
}

func (d *defkit) repositories(req *restful.Request, res *restful.Response) {
	resp, err := d.DefKitService.ListRepositories(req.Request.Context())
	write(req, res, resp, err)
}

func (d *defkit) detail(req *restful.Request, res *restful.Response) {
	resp, err := d.DefKitService.DetailModule(req.Request.Context(), req.PathParameter("name"))
	write(req, res, resp, err)
}

func (d *defkit) preview(req *restful.Request, res *restful.Response) {
	resp, err := d.DefKitService.PreviewModule(req.Request.Context(), req.PathParameter("name"))
	write(req, res, resp, err)
}

func (d *defkit) create(req *restful.Request, res *restful.Response) {
	var body apis.CreateDefKitModuleRequest
	if err := req.ReadEntity(&body); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := validate.Struct(&body); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	resp, err := d.DefKitService.CreateModule(req.Request.Context(), body)
	write(req, res, resp, err)
}

func (d *defkit) update(req *restful.Request, res *restful.Response) {
	var body apis.UpdateDefKitModuleRequest
	if err := req.ReadEntity(&body); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	resp, err := d.DefKitService.UpdateModule(req.Request.Context(), req.PathParameter("name"), body)
	write(req, res, resp, err)
}

func (d *defkit) remove(req *restful.Request, res *restful.Response) {
	err := d.DefKitService.DeleteModule(req.Request.Context(), req.PathParameter("name"))
	write(req, res, apis.EmptyResponse{}, err)
}

func (d *defkit) apply(req *restful.Request, res *restful.Response) {
	var body apis.ApplyDefKitPreviewRequest
	if err := req.ReadEntity(&body); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	err := d.DefKitService.ApplyPreview(req.Request.Context(), req.PathParameter("name"), body)
	write(req, res, apis.EmptyResponse{}, err)
}

// write sends a result, or the error that stopped it.
func write(req *restful.Request, res *restful.Response, entity interface{}, err error) {
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(entity); err != nil {
		bcode.ReturnError(req, res, err)
	}
}
