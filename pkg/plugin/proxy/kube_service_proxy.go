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
	"context"
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
	availableSecret   *corev1.Secret
	cacheTime         time.Time
}

// NewKubeServiceProxy create a proxy for the service
func NewKubeServiceProxy(kubeClient client.Client, plugin *types.Plugin) BackendProxy {
	return &kubeServiceProxy{kubeClient: kubeClient, plugin: plugin}
}

func (k *kubeServiceProxy) Handler(req *http.Request, res http.ResponseWriter) {
	if k.cacheTime.IsZero() || time.Now().After(k.cacheTime) {
		var service corev1.Service
		namespace := k.plugin.BackendService.Namespace
		name := k.plugin.BackendService.Name
		if namespace == "" {
			namespace = kubevelatypes.DefaultKubeVelaNS
		}
		if err := k.kubeClient.Get(req.Context(), apitypes.NamespacedName{Namespace: namespace, Name: name}, &service); err != nil {
			klog.Errorf("failed to discover the backend service:%s/%s err:%s ", name, namespace, err.Error())
			bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
			return
		}
		if len(service.Spec.Ports) == 0 {
			klog.Errorf("there is no port in the backend service:%s/%s err:%s ", name, namespace)
			bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
			return
		}
		matchPort := service.Spec.Ports[0].Port
		if k.plugin.BackendService.Port != 0 {
			havePort := false
			for _, port := range service.Spec.Ports {
				if k.plugin.BackendService.Port == port.Port {
					havePort = true
					matchPort = k.plugin.BackendService.Port
					break
				}
			}
			if !havePort {
				klog.Errorf("there is no port same with the configured port in the backend service:%s/%s err:%s ", name, namespace)
				bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
				return
			}
		}
		if service.Spec.ClusterIP == "" {
			klog.Errorf("there is no port same with the configured port in the backend service:%s/%s err:%s ", name, namespace)
			bcode.ReturnHTTPError(req, res, bcode.ErrUpstreamNotFound)
			return
		}
		availableEndpoint, err := url.Parse(fmt.Sprintf("http://%s:%d", service.Spec.ClusterIP, matchPort))
		if err != nil {
			bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
		}
		k.availableEndpoint = availableEndpoint
		k.cacheTime = time.Now().Add(time.Minute * 10)
	}
	route, _ := req.Context().Value(&RouteCtxKey).(*types.Route)

	director := func(req *http.Request) {
		var base = *k.availableEndpoint
		base.Path = req.URL.Path
		req.URL = &base
		if route != nil {
			// Setting the custom proxy headers
			for _, h := range route.ProxyHeaders {
				req.Header.Set(h.Name, h.Value)
			}
		}
		// Setting the authentication
		if types.Basic == k.plugin.AuthType && k.plugin.AuthSecret != nil {
			if err := k.setBasicAuth(req); err != nil {
				klog.Errorf("can't set the basic auth, err:%s", err.Error())
				return
			}
		}
		for k, v := range req.URL.Query() {
			for _, v1 := range v {
				base.Query().Add(k, v1)
			}
		}
	}
	rp := &httputil.ReverseProxy{Director: director, ErrorLog: log.Default()}
	rp.ServeHTTP(res, req)
}

func (k *kubeServiceProxy) setBasicAuth(req *http.Request) error {
	if err := k.loadAuthSecret(req.Context()); err != nil {
		return err
	}
	req.SetBasicAuth(string(k.availableSecret.Data["username"]), string(k.availableSecret.Data["password"]))
	return nil
}

func (k *kubeServiceProxy) loadAuthSecret(ctx context.Context) error {
	if k.plugin.AuthSecret == nil || k.plugin.AuthSecret.Name == "" {
		return fmt.Errorf("auth secret is invalid")
	}
	namespace := k.plugin.AuthSecret.Namespace
	name := k.plugin.AuthSecret.Name
	if namespace == "" {
		namespace = kubevelatypes.DefaultKubeVelaNS
	}
	if k.availableSecret == nil || time.Now().After(k.cacheTime) {
		var secret corev1.Secret
		if err := k.kubeClient.Get(ctx, apitypes.NamespacedName{Namespace: namespace, Name: name}, &secret); err != nil {
			return err
		}
		k.availableSecret = &secret
	}
	return nil
}
