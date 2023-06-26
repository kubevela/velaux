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
	"net/http"
	"net/http/httptest"
	"net/url"

	kubevelatypes "github.com/oam-dev/kubevela/apis/types"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"

	"github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/config"
	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

var _ = Describe("Test proxy", func() {

	It("Test kube-api proxy", func() {
		plugin := &types.Plugin{
			JSONData: types.JSONData{
				ID:          "node-manage",
				BackendType: types.KubeAPI,
				KubePermissions: []v1.PolicyRule{
					{
						Verbs:     []string{"list"},
						Resources: []string{"nodes"},
						APIGroups: []string{""},
					},
				},
			},
		}
		pluginService := service.NewTestPluginService(config.PluginConfig{}, k8sClient, nil)
		Expect(pluginService.InitPluginRole(context.TODO(), plugin)).To(BeNil())

		proxy, err := NewBackendPluginProxy(plugin, k8sClient, cfg)
		Expect(err).To(BeNil())
		var res = &httptest.ResponseRecorder{}
		var req = &http.Request{Method: "GET", URL: &url.URL{Scheme: "http", Path: "/api/v1/nodes", Host: "127.0.0.1"}}
		req = req.WithContext(context.WithValue(context.TODO(), &apis.CtxKeyUser, "test"))
		proxy.Handler(req, res)
		Expect(res.Code).To(Equal(200))
	})

	It("Test kube-service proxy", func() {
		plugin := &types.Plugin{
			JSONData: types.JSONData{
				ID:          "node-manage",
				BackendType: types.KubeService,
				BackendService: &types.KubernetesService{
					Name: "test",
				},
				AuthType: types.Basic,
				AuthSecret: &types.KubernetesSecret{
					Name: "test",
				},
			},
		}
		testService := &corev1.Service{ObjectMeta: metav1.ObjectMeta{
			Name:      "test",
			Namespace: kubevelatypes.DefaultKubeVelaNS,
		}, Spec: corev1.ServiceSpec{
			Ports: []corev1.ServicePort{
				{
					Name:       "t",
					Port:       80,
					TargetPort: intstr.FromInt(80),
				},
			},
		}}
		Expect(k8sClient.Create(context.TODO(), testService)).Should(BeNil())
		testSecret := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{
			Name:      "test",
			Namespace: kubevelatypes.DefaultKubeVelaNS,
		}, StringData: map[string]string{
			"username": "n1",
			"password": "p1",
		}}
		Expect(k8sClient.Create(context.TODO(), testSecret)).Should(BeNil())
		proxy, err := NewBackendPluginProxy(plugin, k8sClient, cfg)
		Expect(err).To(BeNil())
		var res = &httptest.ResponseRecorder{}
		var req = &http.Request{Method: "GET", URL: &url.URL{Scheme: "http", Path: "/test", Host: "127.0.0.1"}}
		proxy.Handler(req, res)
		Expect(res.Code).To(Equal(502))
	})
})
