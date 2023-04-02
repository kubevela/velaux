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

package proxy

import (
	"fmt"
	"net/http"

	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kubevela/velaux/pkg/plugin/types"
)

// ErrAvailablePlugin -
var ErrAvailablePlugin = fmt.Errorf("there is no available proxy for the plugin")

// RouteCtxKey the context key to save the route
var RouteCtxKey = "route"

// BackendProxy -
type BackendProxy interface {
	Handler(*http.Request, http.ResponseWriter)
}

var proxyCache = make(map[*types.Plugin]BackendProxy)

// NewBackendPluginProxy create or return a proxy tool for a plugin
func NewBackendPluginProxy(plugin *types.Plugin, kubeClient client.Client, kubeConfig *rest.Config) (BackendProxy, error) {
	p, ok := proxyCache[plugin]
	if ok {
		return p, nil
	}
	var err error
	switch plugin.BackendType {
	case types.KubeAPI:
		p, err = NewKubeAPIProxy(kubeConfig, plugin)
		if err != nil {
			return nil, err
		}
	case types.KubeService:
		p = NewKubeServiceProxy(kubeClient, plugin)
	case types.StaticServer:
		p = &staticServerProxy{plugin: plugin}
	default:
		return nil, ErrAvailablePlugin
	}
	proxyCache[plugin] = p
	return p, nil
}
