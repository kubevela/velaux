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

	"github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// ImpersonateGroupHeader this is a header key to impersonate a group
var ImpersonateGroupHeader = "Impersonate-Group"

// ImpersonateUserHeader this is a header key to impersonate a user
var ImpersonateUserHeader = "Impersonate-User"

type kubeAPIProxy struct {
	httpClient *http.Client
	kubeConfig *rest.Config
	plugin     *types.Plugin
	baseURL    *url.URL
}

// NewKubeAPIProxy create a proxy for the Kubernetes API
func NewKubeAPIProxy(kubeConfig *rest.Config, plugin *types.Plugin) (BackendProxy, error) {
	configShallowCopy := *kubeConfig
	httpClient, err := rest.HTTPClientFor(&configShallowCopy)
	if err != nil {
		return nil, err
	}
	u, err := generateDefaultURL(kubeConfig)
	if err != nil {
		return nil, err
	}
	return &kubeAPIProxy{
		kubeConfig: kubeConfig,
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
	userName := req.Context().Value(&apis.CtxKeyUser).(string)
	director := func(req *http.Request) {
		var base = *k.baseURL
		base.Path = req.URL.Path
		req.URL = &base
	}
	rp := &httputil.ReverseProxy{Director: director, Transport: k.httpClient.Transport, ErrorLog: log.Default()}
	req = req.WithContext(
		request.WithUser(req.Context(), &user.DefaultInfo{
			Name:   userName,
			Groups: []string{service.GeneratePluginSubjectName(k.plugin)},
		}))
	rp.ServeHTTP(res, req)
}
