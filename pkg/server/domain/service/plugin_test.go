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
	v1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

var _ = Describe("Test plugin service", func() {
	It("Init service", func() {
		InitTestEnv("test-plugin-service")
		pluginService = NewTestPluginService(config.PluginConfig{
			CustomPluginPath: []string{"./testdata/plugins"},
		}, k8sClient, ds).(*pluginImpl)
	})

	It("Test loading the plugin", func() {
		Expect(pluginService.Init(context.TODO())).Should(BeNil())
		Expect(len(pluginService.ListInstalledPlugins(ctx)), 4)
	})

	It("Test detail the plugin", func() {
		plugin, err := pluginService.DetailInstalledPlugin(context.TODO(), "backend-kube-service")
		Expect(err).Should(BeNil())
		Expect(plugin.BackendType).Should(Equal(types.KubeService))
	})

	It("Test get/enable/disable/set the plugin", func() {
		plugin, err := pluginService.GetPlugin(ctx, "backend-kube-service")
		Expect(err).Should(BeNil())
		Expect(plugin.ID).Should(Equal("backend-kube-service"))
		setting, err := pluginService.GetPluginSetting(ctx, "backend-kube-service")
		Expect(err).Should(BeNil())
		Expect(setting.Enabled).Should(BeFalse())
		_, err = pluginService.DisablePlugin(ctx, "backend-kube-service")
		Expect(err).ShouldNot(BeNil())
		Expect(err).Should(Equal(bcode.ErrPluginAlreadyDisabled))
		_, err = pluginService.EnablePlugin(ctx, "backend-kube-service", v1.PluginEnableRequest{
			JSONData: map[string]interface{}{
				"key1": "val1",
			},
			SecureJSONData: map[string]interface{}{
				"topSecret": "topSecretVal",
			},
		})
		Expect(err).Should(BeNil())
		setting, err = pluginService.GetPluginSetting(ctx, "backend-kube-service")
		Expect(err).Should(BeNil())
		Expect(setting.Enabled).Should(BeTrue())
		Expect(setting.JSONData["key1"]).Should(Equal("val1"))
		Expect(setting.SecureJSONData["topSecret"]).Should(Equal("topSecretVal"))

		By("Test set the plugin")
		_, err = pluginService.SetPlugin(ctx, "backend-kube-service", v1.PluginSetRequest{
			JSONData: map[string]interface{}{
				"key1": "val2",
			},
			SecureJSONData: map[string]interface{}{
				"topSecret": "topSecretVal2",
			},
		})
		Expect(err).Should(BeNil())
		setting, err = pluginService.GetPluginSetting(ctx, "backend-kube-service")
		Expect(err).Should(BeNil())
		Expect(setting.Enabled).Should(BeTrue())
		Expect(setting.JSONData["key1"]).Should(Equal("val2"))
		Expect(setting.SecureJSONData["topSecret"]).Should(Equal("topSecretVal2"))

		By("Test list enabled plugins")
		plugins, err := pluginService.ListEnabledPlugins(ctx)
		Expect(err).Should(BeNil())
		Expect(len(plugins)).Should(Equal(1))
		Expect(plugins[0].ID).Should(Equal("backend-kube-service"))

		By("Test disable the plugin")
		_, err = pluginService.EnablePlugin(ctx, "backend-kube-service", v1.PluginEnableRequest{})
		Expect(err).ShouldNot(BeNil())
		Expect(err).Should(Equal(bcode.ErrPluginAlreadyEnabled))
		_, err = pluginService.DisablePlugin(ctx, "backend-kube-service")
		Expect(err).Should(BeNil())

	})
})
