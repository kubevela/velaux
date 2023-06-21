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
	"path"
	"strings"

	"github.com/julienschmidt/httprouter"
	"k8s.io/klog/v2"

	"github.com/kubevela/velaux/pkg/plugin/types"
)

// DefaultPluginResourceKey the path parameter key for the plugin resource
var DefaultPluginResourceKey = "pluginName"

// Handle the plugin route
type Handle func(http.ResponseWriter, *http.Request, httprouter.Params, *types.Plugin, *types.Route)

var cachePluginRouter = map[string]http.Handler{}

type defaultRouter struct {
	h      Handle
	plugin *types.Plugin
}

func (d *defaultRouter) ServeHTTP(res http.ResponseWriter, req *http.Request) {
	d.h(res, req, httprouter.Params{{Key: DefaultPluginResourceKey, Value: d.plugin.PluginID()}}, d.plugin, &types.Route{})
}

func newDefaultRouter(h Handle, plugin *types.Plugin) *defaultRouter {
	return &defaultRouter{h: h, plugin: plugin}
}

// GetPluginHandler get the plugin backend router, if not exist, will create and cache it
func GetPluginHandler(plugin *types.Plugin, h Handle) http.Handler {
	if r, e := cachePluginRouter[plugin.PluginID()]; e {
		return r
	}
	router := GeneratePluginHandler(plugin, h)
	cachePluginRouter[plugin.PluginID()] = router
	return router
}

// GeneratePluginHandler create and return the plugin backend router
func GeneratePluginHandler(plugin *types.Plugin, h Handle) http.Handler {
	var router http.Handler
	if len(plugin.Routes) == 0 {
		klog.Warningf("plugin %s don't define the routes, will proxy all path requests and not check the permission.", plugin.PluginID())
		router = newDefaultRouter(h, plugin)
	} else {
		r := httprouter.New()
		for _, route := range plugin.Routes {
			routePath := path.Join(types.PluginProxyRoutePath+"/:"+DefaultPluginResourceKey, route.Path)
			method := route.Method
			if method == "" {
				method = "GET"
			}
			r.Handle(strings.ToUpper(method), routePath, func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
				h(w, r, p, plugin, route)
			})
			klog.Infof("Register the plugin proxy route for the plugin %s, method:%s path:%s", plugin.PluginID(), method, routePath)
		}
		router = r
	}
	return router
}
