/*
Copyright 2024 The KubeVela Authors.

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
	"k8s.io/klog/v2"

	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

type groupMapping struct {
	GroupMappingService service.GroupMappingService `inject:""`
	RbacService         service.RBACService         `inject:""`
}

// NewGroupMapping creates the group mapping API handler
func NewGroupMapping() Interface {
	return &groupMapping{}
}

func (g *groupMapping) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/group_mappings").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for OIDC group-to-project/role mappings")

	tags := []string{"group_mapping"}

	ws.Route(ws.GET("/").To(g.getGroupMappings).
		Doc("get the OIDC group-to-project/role mapping configuration").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Filter(g.RbacService.CheckPerm("role", "list")).
		Returns(200, "OK", apis.GroupMappingResponse{}).
		Writes(apis.GroupMappingResponse{}))

	ws.Route(ws.PUT("/").To(g.updateGroupMappings).
		Doc("update the OIDC group-to-project/role mapping configuration").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Filter(g.RbacService.CheckPerm("role", "update")).
		Reads(apis.UpdateGroupMappingRequest{}).
		Returns(200, "OK", apis.GroupMappingResponse{}).
		Writes(apis.GroupMappingResponse{}))

	ws.Filter(authCheckFilter)
	return ws
}

func (g *groupMapping) getGroupMappings(req *restful.Request, res *restful.Response) {
	mappings, err := g.GroupMappingService.GetGroupMappings(req.Request.Context())
	if err != nil {
		klog.Errorf("failed to get group mappings: %s", err.Error())
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(mappings); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (g *groupMapping) updateGroupMappings(req *restful.Request, res *restful.Response) {
	var updateReq apis.UpdateGroupMappingRequest
	if err := req.ReadEntity(&updateReq); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	mappings, err := g.GroupMappingService.UpdateGroupMappings(req.Request.Context(), updateReq)
	if err != nil {
		klog.Errorf("failed to update group mappings: %s", err.Error())
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(mappings); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}
