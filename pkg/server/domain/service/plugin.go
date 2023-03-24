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

	"github.com/kubevela/velaux/pkg/plugin/loader"
	"github.com/kubevela/velaux/pkg/plugin/registry"
	"github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/config"
	assembler "github.com/kubevela/velaux/pkg/server/interfaces/api/assembler/v1"
	v1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

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
	DetailInstalledPlugin(ctx context.Context, pluginId string) (*v1.PluginDTO, error)
	GetPlugin(ctx context.Context, pluginId string) (*types.Plugin, error)
	Init(ctx context.Context) error
}

type pluginImpl struct {
	loader       *loader.Loader
	registry     registry.Pool
	pluginConfig config.PluginConfig
}

func (p *pluginImpl) Init(ctx context.Context) error {
	for _, s := range pluginSources(p.pluginConfig) {
		plugins, err := p.loader.Load(ctx, s.Class, s.Paths, nil)
		if err != nil {
			return err
		}
		for _, plugin := range plugins {
			if err := p.registry.Add(ctx, plugin); err != nil {
				return err
			}
		}
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

func (p *pluginImpl) DetailInstalledPlugin(ctx context.Context, pluginId string) (*v1.PluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginId)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	dto := assembler.PluginToDTO(*plugin)
	return &dto, nil
}

func (p *pluginImpl) GetPlugin(ctx context.Context, pluginId string) (*types.Plugin, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginId)
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
