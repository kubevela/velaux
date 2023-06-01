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

// NewManagePlugin -
func NewManagePlugin() Interface {
	return &ManagePlugin{}
}

// Plugin web service
type Plugin struct {
	RBACService   service.RBACService   `inject:""`
	PluginService service.PluginService `inject:""`
}

// ManagePlugin the web service to manage the plugin
type ManagePlugin struct {
	RBACService   service.RBACService   `inject:""`
	PluginService service.PluginService `inject:""`
}

// GetWebServiceRoute get web service
func (p *Plugin) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/plugins").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for plugin")

	tags := []string{"Plugin"}

	ws.Route(ws.GET("/").To(p.listEnabledPlugins).
		Doc("List the enabled plugins").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.ListPluginResponse{}).
		Writes(apis.ListPluginResponse{}).Do(returns200, returns500))

	ws.Route(ws.GET("/{pluginId}").To(p.detailPlugin).
		Doc("Detail an installed plugin").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.PluginDTO{}).
		Writes(apis.PluginDTO{}).Do(returns200, returns500))

	ws.Filter(authCheckFilter)
	return ws
}

// GetWebServiceRoute get web service
func (p *ManagePlugin) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/manage/plugins").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for plugin manage")

	tags := []string{"Plugin"}

	ws.Route(ws.GET("/").To(p.listInstalledPlugins).
		Doc("List the installed plugins").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Filter(p.RBACService.CheckPerm("managePlugin", "list")).
		Returns(200, "OK", apis.ListPluginResponse{}).
		Writes(apis.ListManagedPluginResponse{}).Do(returns200, returns500))

	ws.Route(ws.GET("/{pluginId}").To(p.detailPlugin).
		Doc("Detail an installed plugin").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Filter(p.RBACService.CheckPerm("managePlugin", "detail")).
		Returns(200, "OK", apis.ManagedPluginDTO{}).
		Writes(apis.PluginDTO{}).Do(returns200, returns500))

	ws.Route(ws.POST("/{pluginId}/setting").To(p.pluginSetting).
		Doc("Set an installed plugin").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Filter(p.RBACService.CheckPerm("managePlugin", "update")).
		Returns(200, "OK", apis.ManagedPluginDTO{}).
		Writes(apis.PluginDTO{}).Do(returns200, returns500))

	ws.Route(ws.POST("/{pluginId}/install").To(p.installPlugin).
		Doc("Install one specific plugin").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Reads(apis.InstallPluginRequest{}).
		Filter(p.RBACService.CheckPerm("managePlugin", "enable")).
		Returns(200, "OK", apis.ManagedPluginDTO{}).
		Writes(apis.PluginDTO{}).Do(returns200, returns500))

	ws.Route(ws.POST("/{pluginId}/uninstall").To(p.uninstallPlugin).
		Doc("Uninstall one specific plugin").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Filter(p.RBACService.CheckPerm("managePlugin", "enable")).
		Returns(200, "OK", struct{}{}).
		Writes(apis.PluginDTO{}).Do(returns200, returns500))

	ws.Route(ws.POST("/{pluginId}/enable").To(p.enablePlugin).
		Doc("Enable an installed plugin").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Reads(apis.PluginEnableRequest{}).
		Filter(p.RBACService.CheckPerm("managePlugin", "enable")).
		Returns(200, "OK", apis.ManagedPluginDTO{}).
		Writes(apis.PluginDTO{}).Do(returns200, returns500))

	ws.Route(ws.POST("/{pluginId}/disable").To(p.disablePlugin).
		Doc("Disable an installed plugin").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Filter(p.RBACService.CheckPerm("managePlugin", "enable")).
		Returns(200, "OK", apis.ManagedPluginDTO{}).
		Writes(apis.PluginDTO{}).Do(returns200, returns500))

	ws.Filter(authCheckFilter)
	return ws
}

func (p *Plugin) listEnabledPlugins(req *restful.Request, res *restful.Response) {
	plugins, err := p.PluginService.ListEnabledPlugins(req.Request.Context())
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	// Write back response data
	if err := res.WriteEntity(apis.ListPluginResponse{Plugins: plugins}); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (p *Plugin) detailPlugin(req *restful.Request, res *restful.Response) {
	plugin, err := p.PluginService.DetailPlugin(req.Request.Context(), req.PathParameter("pluginId"))
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

func (p *ManagePlugin) listInstalledPlugins(req *restful.Request, res *restful.Response) {
	plugins := p.PluginService.ListInstalledPlugins(req.Request.Context())
	// Write back response data
	if err := res.WriteEntity(apis.ListManagedPluginResponse{Plugins: plugins}); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (p *ManagePlugin) installPlugin(req *restful.Request, res *restful.Response) {
	var reqBody apis.InstallPluginRequest
	if err := req.ReadEntity(&reqBody); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	plugin, err := p.PluginService.InstallPlugin(req.Request.Context(), req.PathParameter("pluginId"), reqBody)
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

func (p *ManagePlugin) uninstallPlugin(req *restful.Request, res *restful.Response) {
	err := p.PluginService.UninstallPlugin(req.Request.Context(), req.PathParameter("pluginId"))
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	// Write back response data
	if err := res.WriteEntity(apis.EmptyResponse{}); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (p *ManagePlugin) detailPlugin(req *restful.Request, res *restful.Response) {
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

func (p *ManagePlugin) pluginSetting(req *restful.Request, res *restful.Response) {
	var reqBody apis.PluginSetRequest
	if err := req.ReadEntity(&reqBody); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	plugin, err := p.PluginService.SetPlugin(req.Request.Context(), req.PathParameter("pluginId"), reqBody)
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

func (p *ManagePlugin) enablePlugin(req *restful.Request, res *restful.Response) {
	var reqBody apis.PluginEnableRequest
	if err := req.ReadEntity(&reqBody); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	plugin, err := p.PluginService.EnablePlugin(req.Request.Context(), req.PathParameter("pluginId"), reqBody)
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

func (p *ManagePlugin) disablePlugin(req *restful.Request, res *restful.Response) {
	plugin, err := p.PluginService.DisablePlugin(req.Request.Context(), req.PathParameter("pluginId"))
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
