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
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/oam-dev/kubevela/pkg/utils"
	"github.com/oam-dev/kubevela/pkg/utils/common"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	"github.com/kubevela/velaux/pkg/plugin/loader"
	"github.com/kubevela/velaux/pkg/plugin/registry"
	"github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/config"
	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
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
	// For plugin management
	ListInstalledPlugins(ctx context.Context) []v1.ManagedPluginDTO
	DetailInstalledPlugin(ctx context.Context, pluginID string) (*v1.ManagedPluginDTO, error)
	InstallPlugin(ctx context.Context, pluginID string, params v1.InstallPluginRequest) (*v1.ManagedPluginDTO, error)
	UninstallPlugin(ctx context.Context, pluginID string) error
	EnablePlugin(ctx context.Context, pluginID string, params v1.PluginEnableRequest) (*v1.ManagedPluginDTO, error)
	DisablePlugin(ctx context.Context, pluginID string) (*v1.ManagedPluginDTO, error)
	SetPlugin(ctx context.Context, pluginID string, params v1.PluginSetRequest) (*v1.ManagedPluginDTO, error)

	// For plugin user
	DetailPlugin(ctx context.Context, pluginID string) (*v1.PluginDTO, error)
	ListEnabledPlugins(ctx context.Context) ([]v1.PluginDTO, error)

	// For internal usage
	GetPlugin(ctx context.Context, pluginID string) (*types.Plugin, error)
	GetPluginSetting(ctx context.Context, pluginID string) (*model.PluginSetting, error)
	InitPluginRole(ctx context.Context, plugin *types.Plugin) error
	Init(ctx context.Context) error
}

type pluginImpl struct {
	loader       *loader.Loader
	registry     registry.Pool
	pluginConfig config.PluginConfig
	Store        datastore.DataStore `inject:"datastore"`
	KubeClient   client.Client       `inject:"kubeClient"`
}

func (p *pluginImpl) Init(ctx context.Context) error {
	for _, s := range pluginSources(p.pluginConfig) {
		if err := p.LoadNewPlugin(ctx, s); err != nil {
			return err
		}
	}
	return nil
}

func (p *pluginImpl) LoadNewPlugin(ctx context.Context, s types.PluginSource) error {
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

func (p *pluginImpl) generatePluginFolder(pluginID string) string {
	var path = "plugins"
	if len(p.pluginConfig.CustomPluginPath) > 0 {
		path = p.pluginConfig.CustomPluginPath[0]
	}
	return filepath.Join(path, pluginID)
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
	for _, pl := range plugins {
		setting := model.PluginSetting{
			ID: pl.PluginID(),
		}
		err := p.Store.Get(ctx, &setting)
		if err != nil && !errors.Is(err, datastore.ErrRecordNotExist) {
			klog.Errorf("failed to get the plugin setting for plugin %s err: %s", pl.PluginID(), err.Error())
		}
		pluginDTOs = append(pluginDTOs, assembler.PluginToManagedDTO(*pl, setting))
	}
	return pluginDTOs
}

func (p *pluginImpl) DetailInstalledPlugin(ctx context.Context, pluginID string) (*v1.ManagedPluginDTO, error) {
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
	dto := assembler.PluginToManagedDTO(*plugin, setting)
	return &dto, nil
}

func (p *pluginImpl) GetPlugin(ctx context.Context, pluginID string) (*types.Plugin, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	return plugin, nil
}

func (p *pluginImpl) GetPluginSetting(ctx context.Context, pluginID string) (*model.PluginSetting, error) {
	setting := model.PluginSetting{
		ID: pluginID,
	}
	err := p.Store.Get(ctx, &setting)
	if err != nil && !errors.Is(err, datastore.ErrRecordNotExist) {
		return nil, err
	}
	return &setting, nil
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
func (p *pluginImpl) EnablePlugin(ctx context.Context, pluginID string, params v1.PluginEnableRequest) (*v1.ManagedPluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	setting := model.PluginSetting{
		ID: plugin.PluginID(),
	}
	err := p.Store.Get(ctx, &setting)
	if err != nil && !errors.Is(err, datastore.ErrRecordNotExist) {
		return nil, err
	}
	if setting.Enabled {
		return nil, bcode.ErrPluginAlreadyEnabled
	}
	setting.Enabled = true
	setting.JSONData = params.JSONData
	setting.SecureJSONData = params.SecureJSONData
	method := p.Store.Put
	if errors.Is(err, datastore.ErrRecordNotExist) {
		method = p.Store.Add
	}
	err = method(ctx, &setting)
	if err != nil {
		return nil, err
	}
	dto := assembler.PluginToManagedDTO(*plugin, setting)
	return &dto, nil
}

// InstallPlugin install the plugin from url and enable it automatically.
func (p *pluginImpl) InstallPlugin(ctx context.Context, pluginID string, params v1.InstallPluginRequest) (*v1.ManagedPluginDTO, error) {
	var destFolder = p.generatePluginFolder(pluginID)
	if strings.Contains(pluginID, "..") || strings.Contains(pluginID, "/") {
		return nil, errors.New("pluginID should not contain .. or /")
	}
	err := downloadAndDecompressTarGz(ctx, params.URL, destFolder, params.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to download and decompress the plugin(%s) package from %s: %w", pluginID, params.URL, err)
	}
	err = p.LoadNewPlugin(ctx, types.PluginSource{Class: types.External, Paths: []string{destFolder}})
	if err != nil {
		return nil, fmt.Errorf("failed load the plugin(%s): %w", pluginID, err)
	}
	return p.EnablePlugin(ctx, pluginID, v1.PluginEnableRequest{})
}

// UninstallPlugin will disable and remove the plugin files.
func (p *pluginImpl) UninstallPlugin(ctx context.Context, pluginID string) error {
	var destFolder = p.generatePluginFolder(pluginID)
	if strings.Contains(pluginID, "..") || strings.Contains(pluginID, "/") {
		return errors.New("pluginID should not contain .. or /")
	}
	_, err := p.DisablePlugin(ctx, pluginID)
	if err != nil && !errors.Is(err, bcode.ErrPluginAlreadyDisabled) {
		return err
	}
	err = p.registry.Remove(ctx, pluginID)
	if err != nil {
		return err
	}
	_ = os.RemoveAll(destFolder)
	klog.V(4).Infof("Plugin %s removed from folder %s", pluginID, destFolder)
	return nil
}

func shouldRemoveTopLevelFolder(tarReader *tar.Reader) (bool, error) {
	entries := make(map[string]bool)
	for {
		header, err := tarReader.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return false, fmt.Errorf("error reading tar entry: %w", err)
		}
		pathParts := strings.Split(strings.TrimPrefix(header.Name, "."+string(filepath.Separator)), string(filepath.Separator))
		entries[pathParts[0]] = true
		if len(entries) > 1 {
			return false, nil
		}
	}
	return len(entries) == 1, nil
}

func decompressTarGzTo(gzipReader *gzip.Reader, destFolder string) error {
	// make sure the folder exist
	_ = os.MkdirAll(destFolder, 0750)

	// Check the tar structure to determine whether to remove the top-level folder
	gzipContent, err := io.ReadAll(gzipReader)
	if err != nil {
		return err
	}
	tarReader := tar.NewReader(bytes.NewBuffer(gzipContent))
	removeTopLevelFolder, err := shouldRemoveTopLevelFolder(tarReader)
	if err != nil {
		return err
	}

	tarReader = tar.NewReader(bytes.NewBuffer(gzipContent))
	for {
		header, err := tarReader.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return fmt.Errorf("error reading tar entry: %w", err)
		}
		if strings.Contains(header.Name, "..") {
			continue
		}

		pathParts := strings.Split(header.Name, string(filepath.Separator))
		var relPath string
		if removeTopLevelFolder && len(pathParts) > 1 {
			relPath = filepath.Join(pathParts[1:]...)
		} else {
			relPath = filepath.Join(pathParts...)
		}
		if strings.HasPrefix(relPath, "._") {
			continue
		}
		targetPath := filepath.Join(destFolder, relPath)
		targetPath, _ = filepath.Abs(targetPath)
		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(targetPath, 0750); err != nil {
				return fmt.Errorf("error creating directory: %w", err)
			}
		case tar.TypeReg:

			//nolint:gosec
			outFile, err := os.Create(targetPath)
			if err != nil {
				return fmt.Errorf("error creating file: %w", err)
			}
			for {
				_, err := io.CopyN(outFile, tarReader, 1024)
				if err != nil {
					if errors.Is(err, io.EOF) {
						break
					}
					_ = outFile.Close()
					return fmt.Errorf("error writing file: %w", err)
				}
			}
			_ = outFile.Close()
		}
	}
	return nil
}

func downloadAndDecompressTarGz(ctx context.Context, url, destFolder string, opts *common.HTTPOption) error {
	resp, err := common.HTTPGetResponse(ctx, url, opts)
	if err != nil {
		return err
	}
	//nolint:errcheck
	defer resp.Body.Close()

	gzipReader, err := gzip.NewReader(resp.Body)
	if err != nil {
		return fmt.Errorf("error creating gzip reader: %w", err)
	}
	// nolint:errcheck
	defer gzipReader.Close()

	return decompressTarGzTo(gzipReader, destFolder)
}

// DisablePlugin disable plugin
func (p *pluginImpl) DisablePlugin(ctx context.Context, pluginID string) (*v1.ManagedPluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	setting := model.PluginSetting{
		ID: plugin.PluginID(),
	}
	err := p.Store.Get(ctx, &setting)
	if err != nil && !errors.Is(err, datastore.ErrRecordNotExist) {
		return nil, err
	}
	if !setting.Enabled {
		return nil, bcode.ErrPluginAlreadyDisabled
	}
	setting.Enabled = false
	// Other fields behavior is not defined. For now other fields will be kept. We can re-enable the plugin with the same config.
	err = p.Store.Put(ctx, &setting)
	if err != nil {
		return nil, err
	}
	dto := assembler.PluginToManagedDTO(*plugin, setting)
	return &dto, nil
}

// SetPlugin set plugin config, only success when plugin is enabled
func (p *pluginImpl) SetPlugin(ctx context.Context, pluginID string, params v1.PluginSetRequest) (*v1.ManagedPluginDTO, error) {
	plugin, ok := p.registry.Plugin(ctx, pluginID)
	if !ok {
		return nil, bcode.ErrPluginNotfound
	}
	setting := model.PluginSetting{
		ID: plugin.PluginID(),
	}
	err := p.Store.Get(ctx, &setting)
	if err != nil {
		return nil, err
	}
	if !setting.Enabled {
		return nil, bcode.ErrPluginAlreadyDisabled
	}
	setting.JSONData = params.JSONData
	setting.SecureJSONData = params.SecureJSONData
	err = p.Store.Put(ctx, &setting)
	if err != nil {
		return nil, err
	}
	dto := assembler.PluginToManagedDTO(*plugin, setting)
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
