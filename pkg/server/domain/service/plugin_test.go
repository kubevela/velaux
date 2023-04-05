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

package service

import (
	"context"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"

	"github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/config"
)

var _ = Describe("Test plugin service", func() {
	var pluginService PluginService
	It("Test loading the plugin", func() {
		pluginService = NewTestPluginService(config.PluginConfig{
			CustomPluginPath: []string{"./testdata/plugins"},
		}, k8sClient)
		Expect(pluginService.Init(context.TODO())).Should(BeNil())
		Expect(len(pluginService.ListInstalledPlugins(context.TODO())), 4)
	})

	It("Test detail the plugin", func() {
		plugin, err := pluginService.DetailInstalledPlugin(context.TODO(), "backend-kube-service")
		Expect(err).Should(BeNil())
		Expect(plugin.BackendType).Should(Equal(types.KubeService))
	})
})
