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
	"github.com/google/go-cmp/cmp"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

var _ = Describe("Test plugin rest api", func() {

	It("Test list installed plugins", func() {
		defer GinkgoRecover()
		res := get("/plugins")
		var lpr apisv1.ListPluginResponse
		Expect(decodeResponseBody(res, &lpr)).Should(Succeed())
		Expect(cmp.Diff(len(lpr.Plugins), 1)).Should(BeEmpty())
		Expect(cmp.Diff(lpr.Plugins[0].Module, "public/plugins/app-demo")).Should(BeEmpty())
	})

	It("Test get a installed plugin", func() {
		defer GinkgoRecover()
		res := get("/plugins/app-demo")
		var dto apisv1.PluginDTO
		Expect(decodeResponseBody(res, &dto)).Should(Succeed())
		Expect(cmp.Diff(dto.Module, "public/plugins/app-demo")).Should(BeEmpty())
	})
})