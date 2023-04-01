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

	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	"github.com/oam-dev/kubevela/pkg/utils"

	"github.com/kubevela/velaux/pkg/plugin/loader"
	"github.com/kubevela/velaux/pkg/plugin/registry"
	"github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/config"
	assembler "github.com/kubevela/velaux/pkg/server/interfaces/api/assembler/v1"
	v1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

var pluginRolePrefix = "velaux-plugin:"

// NewPluginService create a plugin service instance
func NewPluginService(pluginConfig config.PluginConfig) PluginService {
	return &pluginImpl{
		loader:       loader.New(),
		registry:     registry.NewInMemory(),
		pluginConfig: pluginConfig,
	}
}

// PluginService the plugin service provide some handler functions about the plugin
type PluginService interface {
	ListInstalledPlugins(ctx context.Context) []v1.PluginDTO
	DetailInstalledPlugin(ctx context.Context, pluginID string) (*v1.PluginDTO, error)
	GetPlugin(ctx context.Context, pluginID string) (*types.Plugin, error)
	InitPluginRole(ctx context.Context, plugin *types.Plugin) error
	Init(ctx context.Context) error
}

type pluginImpl struct {
	loader       *loader.Loader
	registry     registry.Pool
	pluginConfig config.PluginConfig
	KubeClient   client.Client `inject:"kubeClient"`
}

func (p *pluginImpl) Init(ctx context.Context) error {
	for _, s := range pluginSources(p.pluginConfig) {
		plugins, err := p.loader.Load(s.Class, s.Paths, nil)
		if err != nil {
			return err
		}
		klog.V(4).Infof("Loaded %d plugins from %s%s", len(plugins), s.Class, s.Paths)
		for _, plugin := range plugins {
			// Init the plugin role in the kubernetes.
			if plugin.BackendType == types.KubeAPI && len(plugin.KubePermissions) > 0 {
				if err := p.InitPluginRole(ctx, plugin); err != nil {
					klog.Errorf("failed to init the cluster role for the plugin %s err: %s", plugin.PluginID(), err.Error())
					continue
				}
			}
			if err := p.registry.Add(ctx, plugin); err != nil {
				return err
			}
		}
	}
	return nil
}

// GeneratePluginRoleName generate the plugin role name.
func GeneratePluginRoleName(plugin *types.Plugin) string {
	return pluginRolePrefix + plugin.ID
}

// GeneratePluginSubjectName generate the plugin subject(group) name.
func GeneratePluginSubjectName(plugin *types.Plugin) string {
	return pluginRolePrefix + plugin.PluginID()
}

func (p *pluginImpl) InitPluginRole(ctx context.Context, plugin *types.Plugin) error {
	role := &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name:   GeneratePluginRoleName(plugin),
			Labels: map[string]string{},
		},
		Rules: plugin.KubePermissions,
	}
	option, err := utils.CreateOrUpdate(ctx, p.KubeClient, role)
	if err != nil {
		return err
	}
	if err == nil && option == controllerutil.OperationResultCreated {
		klog.Infof("Install the kubernetes role for the plugin %s", plugin.ID)
	}
	roleBinding := &rbacv1.ClusterRoleBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name:   GeneratePluginRoleName(plugin),
			Labels: map[string]string{},
		},
		RoleRef: rbacv1.RoleRef{
			APIGroup: "rbac.authorization.k8s.io",
			Kind:     "ClusterRole",
			Name:     GeneratePluginRoleName(plugin),
		},
		Subjects: []rbacv1.Subject{
			{
				Kind: "Group",
				Name: GeneratePluginSubjectName(plugin),
			},
		},
	}
	option, err = utils.CreateOrUpdate(ctx, p.KubeClient, roleBinding)
	if err != nil {
		return err
	}
	if err == nil && option == controllerutil.OperationResultCreated {
		klog.Infof("Install the kubernetes role binding for the plugin %s", plugin.ID)
	}
	return nil
}

func (p *pluginImpl) ListInstalledPlugins(ctx context.Context) []v1.PluginDTO {
	plugins := p.registry.Plugins(ctx)
	var pluginDTOs []v1.PluginDTO
	for _, p := range plugins {
		pluginDTOs = append(pluginDTOs, assembler.PluginToDTO(*p))
	}
	return pluginDTOs
}

func (p *pluginImpl) DetailInstalledPlugin(ctx context.Context, pluginID string) (*v1.PluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	dto := assembler.PluginToDTO(*plugin)
	return &dto, nil
}

func (p *pluginImpl) GetPlugin(ctx context.Context, pluginID string) (*types.Plugin, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	return plugin, nil
}

func pluginSources(config config.PluginConfig) []types.PluginSource {
	return []types.PluginSource{
		{Class: types.Core, Paths: []string{config.CorePluginPath}},
		{Class: types.External, Paths: config.CustomPluginPath},
	}
}

// NewTestPluginService only used by testing
func NewTestPluginService(pluginConfig config.PluginConfig, kubeClient client.Client) PluginService {
	return &pluginImpl{
		loader:       loader.New(),
		registry:     registry.NewInMemory(),
		pluginConfig: pluginConfig,
		KubeClient:   kubeClient,
	}
}
