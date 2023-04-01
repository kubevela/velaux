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
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	corev1 "k8s.io/api/core/v1"
	apitypes "k8s.io/apimachinery/pkg/types"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	kubevelatypes "github.com/oam-dev/kubevela/apis/types"

	"github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

type kubeServiceProxy struct {
	kubeClient client.Client
	plugin     *types.Plugin
	// cache the service config for 5m.
	availableEndpoint *url.URL
	cacheTime         time.Time
}

// NewKubeServiceProxy create a proxy for the service
func NewKubeServiceProxy(kubeClient client.Client, plugin *types.Plugin) BackendProxy {
	return &kubeServiceProxy{kubeClient: kubeClient, plugin: plugin}
}

func (k *kubeServiceProxy) Handler(req *http.Request, res http.ResponseWriter) {
	if k.cacheTime.IsZero() || time.Now().After(k.cacheTime) {
		var service corev1.Service
		namespace := k.plugin.ServiceDiscover.Namespace
		name := k.plugin.ServiceDiscover.Name
		if namespace == "" {
			namespace = kubevelatypes.DefaultKubeVelaNS
		}
		if err := k.kubeClient.Get(req.Context(), apitypes.NamespacedName{Namespace: namespace, Name: name}, &service); err != nil {
			klog.Errorf("failed to discover the backend service:%s/%s err:%s ", name, namespace, err.Error())
			bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
		}
		if len(service.Spec.Ports) == 0 {
			klog.Errorf("there is no port in the backend service:%s/%s err:%s ", name, namespace)
			bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
		}
		matchPort := service.Spec.Ports[0].Port
		if k.plugin.ServiceDiscover.Port != 0 {
			havePort := false
			for _, port := range service.Spec.Ports {
				if k.plugin.ServiceDiscover.Port == port.Port {
					havePort = true
					matchPort = k.plugin.ServiceDiscover.Port
					break
				}
			}
			if !havePort {
				klog.Errorf("there is no port same with the configured port in the backend service:%s/%s err:%s ", name, namespace)
				bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
			}
		}
		if service.Spec.ClusterIP == "" {
			klog.Errorf("there is no port same with the configured port in the backend service:%s/%s err:%s ", name, namespace)
			bcode.ReturnHTTPError(req, res, bcode.ErrUpstreamNotFound)
		}
		availableEndpoint, err := url.Parse(fmt.Sprintf("http://%s:%d", service.Spec.ClusterIP, matchPort))
		if err != nil {
			bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
		}
		k.availableEndpoint = availableEndpoint
		k.cacheTime = time.Now().Add(time.Minute * 10)
	}
	director := func(req *http.Request) {
		var base = *k.availableEndpoint
		base.Path = req.URL.Path
		req.URL = &base
	}
	rp := &httputil.ReverseProxy{Director: director, ErrorLog: log.Default()}
	rp.ServeHTTP(res, req)
}
