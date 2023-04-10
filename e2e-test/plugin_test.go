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
	"cuelang.org/go/pkg/strings"
	"github.com/google/go-cmp/cmp"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"
)

var _ = Describe("Test the plugin rest api", func() {
	Context("Test manage plugin API", func() {
		By("Request to /manage/plugins")

		It("Test list installed plugins", func() {
			defer GinkgoRecover()
			res := get("/manage/plugins")
			var lpr apisv1.ListPluginResponse
			Expect(decodeResponseBody(res, &lpr)).Should(Succeed())
			Expect(cmp.Diff(len(lpr.Plugins), 2)).Should(BeEmpty())
		})

		It("Test get a installed plugin", func() {
			defer GinkgoRecover()
			res := get("/manage/plugins/app-demo")
			var dto apisv1.PluginDTO
			Expect(decodeResponseBody(res, &dto)).Should(Succeed())
			Expect(cmp.Diff(dto.Module, "plugins/app-demo/module")).Should(BeEmpty())
		})
	})

	Context("Test plugin API", func() {
		By("Request to /proxy/plugins")

		It("Test to request the kube API", func() {
			defer GinkgoRecover()
			By("Before enable the plugin, request the plugin API should return 400")

			res := get(baseDomain + "/proxy/plugins/node-dashboard/api/v1/nodes")
			var nodeList corev1.NodeList
			err := decodeResponseBody(res, &nodeList)
			Expect(err).Should(HaveOccurred())
			Expect(strings.Contains(err.Error(), "the plugin is not enabled")).Should(BeTrue())

			By("After enable the plugin, request the plugin API should return 200")

			res = post("/manage/plugins/node-dashboard/enable", nil)
			var dto apisv1.PluginDTO
			Expect(decodeResponseBody(res, &dto)).Should(Succeed())
			Expect(cmp.Diff(dto.ID, "node-dashboard")).Should(BeEmpty())

			res = get(baseDomain + "/proxy/plugins/node-dashboard/api/v1/nodes")
			Expect(decodeResponseBody(res, &nodeList)).Should(Succeed())
			Expect(cmp.Diff(len(nodeList.Items), 1)).Should(BeEmpty())
		})
	})

	Context("Test to request the plugin static files", func() {
		By("Request to /public/plugins")

		It("Test to get the module file", func() {
			defer GinkgoRecover()
			res := get(baseDomain + "/public/plugins/app-demo/module.js")
			defer func() { _ = res.Body.Close() }()
			Expect(cmp.Diff(res.StatusCode, 200)).Should(BeEmpty())
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
		Expect(cmp.Diff(bcode.BusinessCode, int32(404))).Should(BeEmpty())
	})
})
