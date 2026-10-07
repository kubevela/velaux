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

// sharedWorkflow is the API for shared Workflows. The project, a query
// parameter, picks whose namespace is "project" and whose applications are
// named as users. Project ones are guarded by the project's workflow
// permission; global ones are read under it too, as every project may use
// them, and changed only with the platform's sharedWorkflow permission.
type sharedWorkflow struct {
	RbacService           service.RBACService           `inject:""`
	SharedWorkflowService service.SharedWorkflowService `inject:""`
}

// NewSharedWorkflow is the API for shared Workflows.
func NewSharedWorkflow() Interface {
	return &sharedWorkflow{}
}

func (s *sharedWorkflow) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/shared-workflows").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for the shared Workflows application workflows can reference")

	tags := []string{"sharedWorkflow"}
	project := ws.QueryParameter("project", "the project whose namespace holds its shared workflows").DataType("string").Required(true)
	name := ws.PathParameter("workflowName", "the shared Workflow's name").DataType("string")

	ws.Route(ws.GET("/").To(s.list).
		Doc("list the project's shared workflows, then the global ones").
		Filter(s.RbacService.CheckPerm("project/workflow", "list")).
		Param(project).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.ListSharedWorkflowsResponse{}).
		Writes(apis.ListSharedWorkflowsResponse{}))

	ws.Route(ws.GET("/{scope}/{workflowName}").To(s.detail).
		Doc("detail a shared workflow, project or global").
		Filter(s.RbacService.CheckPerm("project/workflow", "detail")).
		Param(project).
		Param(ws.PathParameter("scope", "project or global").DataType("string")).
		Param(name).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.SharedWorkflow{}).
		Returns(404, "Not Found", bcode.Bcode{}).
		Writes(apis.SharedWorkflow{}))

	ws.Route(ws.POST("/project").To(s.create("project")).
		Doc("create a shared workflow in the project's namespace").
		Filter(s.RbacService.CheckPerm("project/workflow", "create")).
		Param(project).
		Reads(apis.SharedWorkflowRequest{}).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.SharedWorkflow{}).
		Writes(apis.SharedWorkflow{}))

	ws.Route(ws.PUT("/project/{workflowName}").To(s.update("project")).
		Doc("update a shared workflow in the project's namespace").
		Filter(s.RbacService.CheckPerm("project/workflow", "update")).
		Param(project).
		Param(name).
		Reads(apis.SharedWorkflowRequest{}).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.SharedWorkflow{}).
		Writes(apis.SharedWorkflow{}))

	ws.Route(ws.DELETE("/project/{workflowName}").To(s.delete("project")).
		Doc("delete a shared workflow in the project's namespace that nothing uses").
		Filter(s.RbacService.CheckPerm("project/workflow", "delete")).
		Param(project).
		Param(name).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.EmptyResponse{}).
		Writes(apis.EmptyResponse{}))

	ws.Route(ws.POST("/global").To(s.create("global")).
		Doc("create a global shared workflow, in the system namespace").
		Filter(s.RbacService.CheckPerm("sharedWorkflow", "create")).
		Reads(apis.SharedWorkflowRequest{}).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.SharedWorkflow{}).
		Writes(apis.SharedWorkflow{}))

	ws.Route(ws.PUT("/global/{workflowName}").To(s.update("global")).
		Doc("update a global shared workflow").
		Filter(s.RbacService.CheckPerm("sharedWorkflow", "update")).
		Param(name).
		Reads(apis.SharedWorkflowRequest{}).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.SharedWorkflow{}).
		Writes(apis.SharedWorkflow{}))

	ws.Route(ws.DELETE("/global/{workflowName}").To(s.delete("global")).
		Doc("delete a global shared workflow that nothing uses").
		Filter(s.RbacService.CheckPerm("sharedWorkflow", "delete")).
		Param(name).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.EmptyResponse{}).
		Writes(apis.EmptyResponse{}))

	ws.Filter(authCheckFilter)
	return ws
}

func (s *sharedWorkflow) list(req *restful.Request, res *restful.Response) {
	resp, err := s.SharedWorkflowService.ListSharedWorkflows(req.Request.Context(), req.QueryParameter("project"))
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(resp); err != nil {
		bcode.ReturnError(req, res, err)
	}
}

func (s *sharedWorkflow) detail(req *restful.Request, res *restful.Response) {
	resp, err := s.SharedWorkflowService.DetailSharedWorkflow(req.Request.Context(), req.QueryParameter("project"), req.PathParameter("scope"), req.PathParameter("workflowName"))
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(resp); err != nil {
		bcode.ReturnError(req, res, err)
	}
}

func (s *sharedWorkflow) create(scope string) restful.RouteFunction {
	return func(req *restful.Request, res *restful.Response) {
		var body apis.SharedWorkflowRequest
		if err := req.ReadEntity(&body); err != nil {
			bcode.ReturnError(req, res, err)
			return
		}
		if err := validate.Struct(&body); err != nil {
			bcode.ReturnError(req, res, err)
			return
		}
		resp, err := s.SharedWorkflowService.CreateSharedWorkflow(req.Request.Context(), req.QueryParameter("project"), scope, body)
		if err != nil {
			bcode.ReturnError(req, res, err)
			return
		}
		if err := res.WriteEntity(resp); err != nil {
			bcode.ReturnError(req, res, err)
		}
	}
}

func (s *sharedWorkflow) update(scope string) restful.RouteFunction {
	return func(req *restful.Request, res *restful.Response) {
		var body apis.SharedWorkflowRequest
		if err := req.ReadEntity(&body); err != nil {
			bcode.ReturnError(req, res, err)
			return
		}
		name := req.PathParameter("workflowName")
		body.Name = name
		if err := validate.Struct(&body); err != nil {
			bcode.ReturnError(req, res, err)
			return
		}
		resp, err := s.SharedWorkflowService.UpdateSharedWorkflow(req.Request.Context(), req.QueryParameter("project"), scope, name, body)
		if err != nil {
			bcode.ReturnError(req, res, err)
			return
		}
		if err := res.WriteEntity(resp); err != nil {
			bcode.ReturnError(req, res, err)
		}
	}
}

func (s *sharedWorkflow) delete(scope string) restful.RouteFunction {
	return func(req *restful.Request, res *restful.Response) {
		if err := s.SharedWorkflowService.DeleteSharedWorkflow(req.Request.Context(), req.QueryParameter("project"), scope, req.PathParameter("workflowName")); err != nil {
			bcode.ReturnError(req, res, err)
			return
		}
		if err := res.WriteEntity(apis.EmptyResponse{}); err != nil {
			bcode.ReturnError(req, res, err)
		}
	}
}
