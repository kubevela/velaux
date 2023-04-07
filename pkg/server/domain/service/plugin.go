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
	"errors"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"

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
	ListInstalledPlugins(ctx context.Context) []v1.ManagedPluginDTO
	DetailInstalledPlugin(ctx context.Context, pluginID string) (*v1.ManagedPluginDTO, error)
	DetailPlugin(ctx context.Context, pluginID string) (*v1.PluginDTO, error)
	GetPlugin(ctx context.Context, pluginID string) (*types.Plugin, error)
	InitPluginRole(ctx context.Context, plugin *types.Plugin) error

	EnablePlugin(ctx context.Context, pluginID string, params v1.PluginEnableRequest) (*v1.PluginDTO, error)
	DisablePlugin(ctx context.Context, pluginID string) (*v1.PluginDTO, error)
	SetPlugin(ctx context.Context, pluginID string, params v1.PluginSetRequest) (*v1.PluginDTO, error)
	ListEnabledPlugins(ctx context.Context) ([]v1.PluginDTO, error)

	Init(ctx context.Context) error
}

type pluginImpl struct {
	loader       *loader.Loader
	registry     registry.Pool
	pluginConfig config.PluginConfig
	Store        datastore.DataStore `inject:"dataStore"`
	KubeClient   client.Client       `inject:"kubeClient"`
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
	if option == controllerutil.OperationResultCreated {
		klog.Infof("Install the kubernetes role for the plugin %s", plugin.ID)
	}
	if option == controllerutil.OperationResultUpdated {
		klog.Infof("Update the kubernetes role for the plugin %s", plugin.ID)
	}

	if option == controllerutil.OperationResultNone {
		klog.Infof("the kubernetes role for the plugin %s has not changed", plugin.ID)
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

func (p *pluginImpl) ListInstalledPlugins(ctx context.Context) []v1.ManagedPluginDTO {
	plugins := p.registry.Plugins(ctx)
	var pluginDTOs []v1.ManagedPluginDTO
	for _, p := range plugins {
		pluginDTOs = append(pluginDTOs, assembler.PluginToManagedDTO(*p))
	}
	return pluginDTOs
}

func (p *pluginImpl) DetailInstalledPlugin(ctx context.Context, pluginID string) (*v1.ManagedPluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	dto := assembler.PluginToManagedDTO(*plugin)
	return &dto, nil
}

func (p *pluginImpl) GetPlugin(ctx context.Context, pluginID string) (*types.Plugin, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	setting := model.PluginSetting{
		ID: pluginID,
	}
	err := p.Store.Get(ctx, &setting)
	if err != nil && !errors.Is(err, datastore.ErrRecordNotExist) {
		return nil, err
	}
	plugin.Setting = setting
	return plugin, nil
}

// DetailPlugin detail the plugin.
func (p *pluginImpl) DetailPlugin(ctx context.Context, pluginID string) (*v1.PluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	dto := assembler.PluginToDTO(*plugin)
	return &dto, nil
}

// EnablePlugin enable the plugin.
func (p *pluginImpl) EnablePlugin(ctx context.Context, pluginID string, params v1.PluginEnableRequest) (*v1.PluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	ps := model.PluginSetting{
		ID: plugin.PluginID(),
	}
	err := p.Store.Get(ctx, &ps)
	if err != nil && !errors.Is(err, datastore.ErrRecordNotExist) {
		return nil, err
	}
	if ps.Enabled {
		return nil, bcode.ErrPluginAlreadyEnabled
	}
	ps.Enabled = true
	ps.JSONData = params.JSONData
	ps.SecureJSONData = params.SecureJSONData
	method := p.Store.Put
	if errors.Is(err, datastore.ErrRecordNotExist) {
		method = p.Store.Add
	}
	err = method(ctx, &ps)
	if err != nil {
		return nil, err
	}
	dto := assembler.PluginToDTO(*plugin)
	return &dto, nil
}

// DisablePlugin disable plugin
func (p *pluginImpl) DisablePlugin(ctx context.Context, pluginID string) (*v1.PluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	ps := model.PluginSetting{
		ID: plugin.PluginID(),
	}
	err := p.Store.Get(ctx, &ps)
	if err != nil && !errors.Is(err, datastore.ErrRecordNotExist) {
		return nil, err
	}
	if !ps.Enabled {
		return nil, bcode.ErrPluginAlreadyDisabled
	}
	ps.Enabled = false
	err = p.Store.Put(ctx, &ps)
	if err != nil {
		return nil, err
	}
	dto := assembler.PluginToDTO(*plugin)
	return &dto, nil
}

// SetPlugin set plugin config, only success when plugin is enabled
func (p *pluginImpl) SetPlugin(ctx context.Context, pluginID string, params v1.PluginSetRequest) (*v1.PluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	ps := model.PluginSetting{
		ID: plugin.PluginID(),
	}
	err := p.Store.Get(ctx, &ps)
	if err != nil {
		return nil, err
	}
	if !ps.Enabled {
		return nil, bcode.ErrPluginAlreadyDisabled
	}
	ps.JSONData = params.JSONData
	ps.SecureJSONData = params.SecureJSONData
	err = p.Store.Put(ctx, &ps)
	if err != nil {
		return nil, err
	}
	dto := assembler.PluginToDTO(*plugin)
	return &dto, nil
}

func (p *pluginImpl) ListEnabledPlugins(ctx context.Context) ([]v1.PluginDTO, error) {
	plugins := p.registry.Plugins(ctx)
	var pluginDTOs []v1.PluginDTO
	pluginSettings, err := p.Store.List(ctx, &model.PluginSetting{}, nil)
	if err != nil {
		return pluginDTOs, err
	}
	for _, p := range plugins {
		for _, ps := range pluginSettings {
			if p.PluginID() == ps.(*model.PluginSetting).ID {
				if ps.(*model.PluginSetting).Enabled {
					pluginDTOs = append(pluginDTOs, assembler.PluginToDTO(*p))
				}
			}
		}
	}
	return pluginDTOs, nil
}

func pluginSources(config config.PluginConfig) []types.PluginSource {
	return []types.PluginSource{
		{Class: types.Core, Paths: []string{config.CorePluginPath}},
		{Class: types.External, Paths: config.CustomPluginPath},
	}
}

// NewTestPluginService only used by testing
func NewTestPluginService(pluginConfig config.PluginConfig, kubeClient client.Client, store datastore.DataStore) PluginService {
	return &pluginImpl{
		loader:       loader.New(),
		registry:     registry.NewInMemory(),
		pluginConfig: pluginConfig,
		Store:        store,
		KubeClient:   kubeClient,
	}
}
