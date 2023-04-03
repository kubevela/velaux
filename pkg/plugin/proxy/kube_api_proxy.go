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
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"

	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apiserver/pkg/authentication/user"
	"k8s.io/apiserver/pkg/endpoints/request"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/transport"

	pkgmulticluster "github.com/kubevela/pkg/multicluster"
	"github.com/oam-dev/kubevela/pkg/multicluster"

	"github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

type kubeAPIProxy struct {
	httpClient *http.Client
	kubeConfig *rest.Config
	plugin     *types.Plugin
	baseURL    *url.URL
}

type disableImpersonate struct {
	rt http.RoundTripper
}

// By the default, NewImpersonatingRoundTripper is called, the impersonate set to true.
func (rt *disableImpersonate) RoundTrip(req *http.Request) (*http.Response, error) {
	query := req.URL.Query()
	query.Set("impersonate", "false")
	req.URL.RawQuery = query.Encode()
	return rt.rt.RoundTrip(req)
}

// DisableClusterGatewayAuthTransportWrapper disable impersonate feature in Cluster Gateway
func DisableClusterGatewayAuthTransportWrapper() transport.WrapperFunc {
	return func(rt http.RoundTripper) (ret http.RoundTripper) {
		return &disableImpersonate{rt: rt}
	}
}

// NewKubeAPIProxy create a proxy for the Kubernetes API
func NewKubeAPIProxy(kubeConfig *rest.Config, plugin *types.Plugin) (BackendProxy, error) {
	configShallowCopy := rest.CopyConfig(kubeConfig)
	configShallowCopy.Wrap(pkgmulticluster.NewTransportWrapper())
	configShallowCopy.Wrap(DisableClusterGatewayAuthTransportWrapper())
	httpClient, err := rest.HTTPClientFor(configShallowCopy)
	if err != nil {
		return nil, err
	}
	u, err := generateDefaultURL(configShallowCopy)
	if err != nil {
		return nil, err
	}

	return &kubeAPIProxy{
		kubeConfig: configShallowCopy,
		plugin:     plugin,
		httpClient: httpClient,
		baseURL:    u,
	}, nil
}

func generateDefaultURL(config *rest.Config) (*url.URL, error) {
	hasCA := len(config.CAFile) != 0 || len(config.CAData) != 0
	hasCert := len(config.CertFile) != 0 || len(config.CertData) != 0
	defaultTLS := hasCA || hasCert || config.Insecure
	host := config.Host
	if host == "" {
		host = "localhost"
	}
	if config.GroupVersion != nil {
		u, _, err := rest.DefaultServerURL(host, config.APIPath, *config.GroupVersion, defaultTLS)
		return u, err
	}
	u, _, err := rest.DefaultServerURL(host, config.APIPath, schema.GroupVersion{}, defaultTLS)
	return u, err
}

func (k *kubeAPIProxy) Handler(req *http.Request, res http.ResponseWriter) {
	userName, ok := req.Context().Value(&apis.CtxKeyUser).(string)
	if !ok {
		bcode.ReturnHTTPError(req, res, bcode.ErrUnauthorized)
	}
	director := func(req *http.Request) {
		var base = *k.baseURL
		base.Path = req.URL.Path
		for k, v := range req.URL.Query() {
			for _, v1 := range v {
				base.Query().Add(k, v1)
			}
		}
		req.URL = &base
	}
	rp := &httputil.ReverseProxy{Director: director, Transport: k.httpClient.Transport, ErrorLog: log.Default()}
	req = req.WithContext(
		request.WithUser(req.Context(), &user.DefaultInfo{
			Name:   userName,
			Groups: []string{service.GeneratePluginSubjectName(k.plugin)},
		}))
	if req.URL.Query().Get("cluster") != "" {
		req = req.WithContext(
			multicluster.ContextWithClusterName(req.Context(), req.URL.Query().Get("cluster")))
	}
	rp.ServeHTTP(res, req)
}
