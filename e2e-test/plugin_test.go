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

package e2e_test

import (
	"fmt"

	"cuelang.org/go/pkg/strings"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func enablePlugin(id string) {
	res := post(fmt.Sprintf("/manage/plugins/%s/enable", id), nil)
	var dto apisv1.PluginDTO
	Expect(decodeResponseBody(res, &dto)).Should(Succeed())
	Expect(dto.ID).Should(Equal(id))
}

var _ = Describe("Test the plugin rest api", func() {
	Context("Test manage plugin API. Request to /manage/plugins", func() {
		It("Test list installed plugins", func() {
			defer GinkgoRecover()
			res := get("/manage/plugins")
			var lpr apisv1.ListManagedPluginResponse
			Expect(decodeResponseBody(res, &lpr)).Should(Succeed())
			Expect(len(lpr.Plugins)).Should(Equal(2))
			Expect(lpr.Plugins[0].Enabled).Should(BeFalse())
		})

		It("Test detail a installed plugin", func() {
			defer GinkgoRecover()
			res := get("/manage/plugins/app-demo")
			var dto apisv1.ManagedPluginDTO
			Expect(decodeResponseBody(res, &dto)).Should(Succeed())
			Expect(dto.Module).Should(Equal("plugins/app-demo/module"))
		})

		It("Test enable/set/disable plugin", func() {
			By("before enable")
			res := get("/manage/plugins/app-demo")
			var dto apisv1.ManagedPluginDTO
			Expect(decodeResponseBody(res, &dto)).Should(Succeed())
			Expect(dto.Enabled).Should(BeFalse())

			By("enable")
			enableReq := apisv1.PluginEnableRequest{
				JSONData: map[string]interface{}{
					"arg1": "value1",
				},
				SecureJSONData: map[string]interface{}{
					"arg2": "value2",
				},
			}
			res = post("/manage/plugins/app-demo/enable", enableReq)
			Expect(decodeResponseBody(res, &dto)).Should(Succeed())
			Expect(dto.Enabled).Should(BeTrue())
			Expect(dto.JSONSetting["arg1"]).Should(Equal("value1"))
			Expect(dto.SecureJSONFields["arg2"]).Should(Equal(true))

			By("after enable, get")
			res = get("/manage/plugins/app-demo")
			Expect(decodeResponseBody(res, &dto)).Should(Succeed())
			Expect(dto.Enabled).Should(BeTrue())
			Expect(dto.JSONSetting["arg1"]).Should(Equal("value1"))
			Expect(dto.SecureJSONFields["arg2"]).Should(Equal(true))

			By("change the setting")
			setReq := apisv1.PluginSetRequest{
				JSONData: map[string]interface{}{
					"arg1": "changedValue1",
				},
				SecureJSONData: map[string]interface{}{
					"arg2":   "changedValue2",
					"addArg": "addValue",
				},
			}
			res = post("/manage/plugins/app-demo/setting", setReq)
			Expect(decodeResponseBody(res, &dto)).Should(Succeed())
			Expect(dto.Enabled).Should(BeTrue())
			Expect(dto.JSONSetting["arg1"]).Should(Equal("changedValue1"))
			Expect(dto.SecureJSONFields["arg2"]).Should(Equal(true))
			Expect(dto.SecureJSONFields["addArg"]).Should(Equal(true))

			By("disable the plugin")
			res = post("/manage/plugins/app-demo/disable", nil)
			Expect(decodeResponseBody(res, &dto)).Should(Succeed())
			Expect(dto.Enabled).Should(BeFalse())
		})
	})

	Context("Test plugin API. Request to /proxy/plugins", func() {
		It("Test to request the kube API", func() {
			defer GinkgoRecover()
			By("Before enable the plugin, request the plugin API should return 400")

			res := get(baseDomain + "/proxy/plugins/node-dashboard/api/v1/nodes")
			var nodeList corev1.NodeList
			err := decodeResponseBody(res, &nodeList)
			Expect(err).Should(HaveOccurred())
			Expect(strings.Contains(err.Error(), "the plugin is not enabled")).Should(BeTrue())

			By("After enable the plugin, request the plugin API should return 200")
			enablePlugin("node-dashboard")

			res = get(baseDomain + "/proxy/plugins/node-dashboard/api/v1/nodes")
			Expect(decodeResponseBody(res, &nodeList)).Should(Succeed())
			Expect(len(nodeList.Items)).Should(Equal(1))
		})
	})

	Context("Test to request the plugin static files. Request to /public/plugins", func() {
		It("Test to get the module file", func() {
			defer GinkgoRecover()
			res := get(baseDomain + "/public/plugins/app-demo/module.js")
			defer func() { _ = res.Body.Close() }()
			Expect(res.StatusCode).Should(Equal(200))
		})
	})

})

var _ = Describe("Test to request the dex plugin", func() {
	It("Test to request the dex", func() {
		defer GinkgoRecover()
		res := get(baseDomain + "/dex/a")
		var bcode bcode.Bcode
		err := decodeResponseBody(res, &bcode)
		Expect(strings.HasPrefix(err.Error(), "response code is not 200")).Should(BeTrue())
		Expect(bcode.BusinessCode).Should(Equal(int32(404)))
	})
})
