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

package loader

import (
	"encoding/json"
	"errors"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"

	"k8s.io/klog/v2"

	"github.com/grafana/grafana/pkg/infra/fs"
	"github.com/grafana/grafana/pkg/plugins/manager/loader/finder"

	"github.com/kubevela/velaux/pkg/plugin/types"
)

var (
	// ErrInvalidPluginJSON -
	ErrInvalidPluginJSON = errors.New("did not find valid type or id properties in plugin.json")
	// ErrInvalidPluginID -
	ErrInvalidPluginID = errors.New("the id properties is invalid in plugin.json([a-z][a-z-]{4,32})")
	// ErrInvalidPluginJSONFilePath -
	ErrInvalidPluginJSONFilePath = errors.New("invalid plugin.json filepath was provided")
	// ErrInvalidInclude -
	ErrInvalidInclude = errors.New("the include config is invalid in plugin.json")
	// ErrInvalidBackendTypeNotSupport -
	ErrInvalidBackendTypeNotSupport = errors.New("the backend type is invalid in plugin.json, The options include: kube-api、kube-service、static-server")

	// ErrInvalidBackendTypeNoPermission -
	ErrInvalidBackendTypeNoPermission = errors.New("the backend type is invalid in plugin.json, the kubePermissions field is required if the type is kube-api")

	// ErrInvalidBackendTypeNoBackendService -
	ErrInvalidBackendTypeNoBackendService = errors.New("the backend type is invalid in plugin.json, the backendService field is required if the type is kube-service")

	// ErrInvalidBackendAuth -
	ErrInvalidBackendAuth = errors.New("backend auth only support the basic")

	// ErrInvalidBackendAuthEmptySecret -
	ErrInvalidBackendAuthEmptySecret = errors.New("the authSecret field is required when the auth type is defined")
)

var (
	pluginIDReg = regexp.MustCompile("^[a-z][a-z-]{4,32}$")
)

// Loader the tool class to load the plugin from the specified path.
type Loader struct {
	pluginFinder finder.Finder
}

// New -
func New() *Loader {
	return &Loader{
		pluginFinder: finder.New(),
	}
}

// Load loads plugins from the specified path.
func (l *Loader) Load(class types.Class, paths []string, ignore map[string]struct{}) ([]*types.Plugin, error) {
	pluginJSONPaths, err := l.pluginFinder.Find(paths)
	if err != nil {
		return nil, err
	}
	return l.loadPlugins(class, pluginJSONPaths, ignore)
}

func (l *Loader) loadPlugins(class types.Class, pluginJSONPaths []string, existingPlugins map[string]struct{}) ([]*types.Plugin, error) {
	var foundPlugins = foundPlugins{}

	// load plugin.json files and map directory to JSON data
	for _, pluginJSONPath := range pluginJSONPaths {
		plugin, err := l.readPluginJSON(pluginJSONPath)
		if err != nil {
			klog.Warningf("skipping plugin loading as its plugin.json could not be read,path:%s,err:%s", pluginJSONPath, err.Error())
			continue
		}
		pluginJSONAbsPath, err := filepath.Abs(pluginJSONPath)
		if err != nil {
			klog.Warningf("skipping plugin loading as absolute plugin.json path could not be calculated,pluginID:%s,err:%s", plugin.ID, err.Error())
			continue
		}
		if _, dupe := foundPlugins[filepath.Dir(pluginJSONAbsPath)]; dupe {
			klog.Warningf("skipping plugin loading as it's a duplicate,pluginID:%s", plugin.ID)
			continue
		}
		foundPlugins[filepath.Dir(pluginJSONAbsPath)] = plugin
	}

	foundPlugins.stripDuplicates(existingPlugins)

	loadedPlugins := make(map[string]*types.Plugin)
	for pluginDir, pluginJSON := range foundPlugins {
		plugin := createPluginBase(pluginJSON, class, pluginDir)
		loadedPlugins[plugin.PluginDir] = plugin
	}

	verifiedPlugins := make([]*types.Plugin, 0)
	for _, plugin := range loadedPlugins {
		// verify module.js exists for SystemJS to load
		if !plugin.IsCorePlugin() {
			module := filepath.Join(plugin.PluginDir, "module.js")
			if exists, err := fs.Exists(module); err != nil {
				return nil, err
			} else if !exists {
				klog.Errorf("Plugin missing module.js, pluginID: %s, warning: %s, path: %s", plugin.ID,
					"Missing module.js, If you loaded this plugin from git, make sure to compile it.",
					module)
				continue
			}
		}
		verifiedPlugins = append(verifiedPlugins, plugin)
	}

	return verifiedPlugins, nil
}

func (l *Loader) readPluginJSON(pluginJSONPath string) (types.JSONData, error) {
	klog.V(4).Info("Loading plugin, path: %s", pluginJSONPath)

	if !strings.EqualFold(filepath.Ext(pluginJSONPath), ".json") {
		return types.JSONData{}, ErrInvalidPluginJSONFilePath
	}

	// nolint:gosec
	// We can ignore the gosec G304 warning on this one because `currentPath` is based
	// on plugin the folder structure on disk and not user input.
	reader, err := os.Open(pluginJSONPath)
	if err != nil {
		return types.JSONData{}, err
	}

	plugin := types.JSONData{}
	if err := json.NewDecoder(reader).Decode(&plugin); err != nil {
		return types.JSONData{}, err
	}

	if err := reader.Close(); err != nil {
		klog.Warningf("Failed to close JSON file, path: %s, err: %s", pluginJSONPath, err.Error())
	}

	if err := validatePluginJSON(plugin); err != nil {
		return types.JSONData{}, err
	}

	klog.Infof("Loaded plugin,id: %s type: %s path: %s", plugin.ID, plugin.Type, pluginJSONPath)

	return plugin, nil
}

func createPluginBase(pluginJSON types.JSONData, class types.Class, pluginDir string) *types.Plugin {
	plugin := &types.Plugin{
		JSONData:  pluginJSON,
		PluginDir: pluginDir,
		BaseURL:   baseURL(pluginJSON, class, pluginDir),
		Module:    module(pluginJSON, class, pluginDir),
		Class:     class,
	}
	setImages(plugin)
	return plugin
}

func setImages(p *types.Plugin) {
	p.Info.Logos.Small = pluginLogoURL(p.Type, p.Info.Logos.Small, p.BaseURL)
	p.Info.Logos.Large = pluginLogoURL(p.Type, p.Info.Logos.Large, p.BaseURL)

	for i := 0; i < len(p.Info.Screenshots); i++ {
		p.Info.Screenshots[i].Path = evalRelativePluginURLPath(p.Info.Screenshots[i].Path, p.BaseURL, p.Type)
	}
}

func pluginLogoURL(pluginType types.Type, path, baseURL string) string {
	if path == "" {
		return defaultLogoPath(pluginType)
	}

	return evalRelativePluginURLPath(path, baseURL, pluginType)
}

func defaultLogoPath(pluginType types.Type) string {
	return "public/img/icn-" + string(pluginType) + ".svg"
}

func evalRelativePluginURLPath(pathStr, baseURL string, pluginType types.Type) string {
	if pathStr == "" {
		return ""
	}

	u, _ := url.Parse(pathStr)
	if u.IsAbs() {
		return pathStr
	}

	// is set as default or has already been prefixed with base path
	if pathStr == defaultLogoPath(pluginType) || strings.HasPrefix(pathStr, baseURL) {
		return pathStr
	}

	return path.Join(baseURL, pathStr)
}

func baseURL(pluginJSON types.JSONData, class types.Class, pluginDir string) string {
	if class == types.Core {
		return path.Join("public/app/plugins", string(pluginJSON.Type), filepath.Base(pluginDir))
	}

	return path.Join("public/plugins", pluginJSON.ID)
}

func module(pluginJSON types.JSONData, class types.Class, pluginDir string) string {
	if class == types.Core {
		return path.Join("app/plugins", string(pluginJSON.Type), filepath.Base(pluginDir), "module")
	}

	return path.Join("plugins", pluginJSON.ID, "module")
}

func validatePluginJSON(data types.JSONData) error {
	if data.ID == "" || !data.Type.IsValid() {
		return ErrInvalidPluginJSON
	}
	if !pluginIDReg.MatchString(data.ID) {
		return ErrInvalidPluginJSON
	}
	for _, i := range data.Includes {
		if i.Name == "" || !strings.HasPrefix(i.To, "/plugins") || len(i.RelatedRoute) == 0 {
			return ErrInvalidInclude
		}
	}
	if data.Backend && data.BackendType != types.KubeAPI && data.BackendType != types.KubeService && data.BackendType != types.StaticServer {
		return ErrInvalidBackendTypeNotSupport
	}
	if data.BackendType == types.KubeAPI && len(data.KubePermissions) == 0 {
		return ErrInvalidBackendTypeNoPermission
	}

	if data.BackendType == types.KubeService && (data.BackendService == nil || data.BackendService.Name == "") {
		return ErrInvalidBackendTypeNoBackendService
	}

	if data.AuthType != "" && data.AuthType == types.Basic {
		return ErrInvalidBackendAuth
	}

	if data.AuthType == types.Basic && (data.AuthSecret == nil || data.AuthSecret.Name == "") {
		return ErrInvalidBackendAuth
	}

	return nil
}

type foundPlugins map[string]types.JSONData

// stripDuplicates will strip duplicate plugins or plugins that already exist
func (f *foundPlugins) stripDuplicates(existingPlugins map[string]struct{}) {
	pluginsByID := make(map[string]struct{})
	for k, scannedPlugin := range *f {
		if _, existing := existingPlugins[scannedPlugin.ID]; existing {
			klog.Info("Skipping plugin as it's already installed", "plugin", scannedPlugin.ID)
			delete(*f, k)
			continue
		}

		pluginsByID[scannedPlugin.ID] = struct{}{}
	}
}
