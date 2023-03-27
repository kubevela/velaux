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

package api

import (
	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	"github.com/emicklei/go-restful/v3"

	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// NewPlugin new plugin interface
func NewPlugin() Interface {
	return &Plugin{}
}

// Plugin plugin web service
type Plugin struct {
	RbacService   service.RBACService   `inject:""`
	PluginService service.PluginService `inject:""`
}

// GetWebServiceRoute get web service
func (p *Plugin) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/plugins").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for Target manage")

	tags := []string{"Target"}

	ws.Route(ws.GET("/").To(p.listInstalledPlugins).
		Doc("list installed plugins").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.ListPluginResponse{}).
		Writes(apis.ListPluginResponse{}).Do(returns200, returns500))

	ws.Route(ws.GET("/{pluginId}").To(p.detailInstalledPlugin).
		Doc("detail an installed plugin").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.PluginDTO{}).
		Writes(apis.PluginDTO{}).Do(returns200, returns500))

	ws.Filter(authCheckFilter)
	return ws
}

func (p *Plugin) listInstalledPlugins(req *restful.Request, res *restful.Response) {
	plugins := p.PluginService.ListInstalledPlugins(req.Request.Context())
	// Write back response data
	if err := res.WriteEntity(apis.ListPluginResponse{Plugins: plugins}); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (p *Plugin) detailInstalledPlugin(req *restful.Request, res *restful.Response) {
	plugin, err := p.PluginService.DetailInstalledPlugin(req.Request.Context(), req.PathParameter("pluginId"))
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	// Write back response data
	if err := res.WriteEntity(plugin); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}
