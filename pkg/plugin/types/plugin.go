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

package types

import (
	"encoding/json"
)

// Plugin VelaUX plugin model
type Plugin struct {
	JSONData
	PluginDir     string
	Class         Class
	DefaultNavURL string
	Pinned        bool
	Children      []*Plugin
	// SystemJS fields
	Module  string
	BaseURL string
}

// BuildInfo the plugin build info
type BuildInfo struct {
	Time   int64  `json:"time,omitempty"`
	Repo   string `json:"repo,omitempty"`
	Branch string `json:"branch,omitempty"`
	Hash   string `json:"hash,omitempty"`
}

// InfoLink the link model
type InfoLink struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

// Logos the log model
type Logos struct {
	Small string `json:"small"`
	Large string `json:"large"`
}

// Screenshots the screenshot model
type Screenshots struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

// Info the info model
type Info struct {
	Author      InfoLink      `json:"author"`
	Description string        `json:"description"`
	Links       []InfoLink    `json:"links"`
	Logos       Logos         `json:"logos"`
	Build       BuildInfo     `json:"build"`
	Screenshots []Screenshots `json:"screenshots"`
	Version     string        `json:"version"`
	Updated     string        `json:"updated"`
}

// Requirement the plugin requirement
type Requirement struct {
	VelaUXVersion string `json:"velauxVersion"`
}

// JSONData represents the plugin's plugin.json
type JSONData struct {
	ID           string      `json:"id"`
	Type         Type        `json:"type"`
	Name         string      `json:"name"`
	Info         Info        `json:"info"`
	Includes     []*Includes `json:"includes"`
	Category     string      `json:"category"`
	HideFromList bool        `json:"hideFromList,omitempty"`
	Preload      bool        `json:"preload"`
	Backend      bool        `json:"backend"`
	Routes       []*Route    `json:"routes"`
	Requirement  Requirement `json:"requirement"`
}

// Includes means the menus that this plugin include.
type Includes struct {
	Name         string      `json:"name"`
	Label        string      `json:"label"`
	To           string      `json:"to"`
	Type         string      `json:"type"`
	Icon         string      `json:"icon"`
	Workspace    Workspace   `json:"workspace"`
	Permission   *Permission `json:"permission,omitempty"`
	RelatedRoute []string    `json:"relatedRoute"`
	Catalog      string      `json:"catalog,omitempty"`
}

// Workspace the workspace menu
type Workspace struct {
	Name string `json:"name"`
}

// Permission RBAC permission policy
type Permission struct {
	Resources []string `json:"resource"`
	Actions   []string `json:"actions"`
}

// Route describes a plugin route that is defined in
// the plugin.json file for a plugin.
type Route struct {
	Path         string          `json:"path"`
	Method       string          `json:"method"`
	URL          string          `json:"url"`
	URLParams    []URLParam      `json:"urlParams"`
	Headers      []Header        `json:"headers"`
	AuthType     string          `json:"authType"`
	TokenAuth    *JWTTokenAuth   `json:"tokenAuth"`
	JwtTokenAuth *JWTTokenAuth   `json:"jwtTokenAuth"`
	Body         json.RawMessage `json:"body"`
}

// Header describes an HTTP header that is forwarded with
// the proxied request for a plugin route
type Header struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

// URLParam describes query string parameters for
// a url in a plugin route
type URLParam struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

// JWTTokenAuth struct is both for normal Token Auth and JWT Token Auth with
// an uploaded JWT file.
type JWTTokenAuth struct {
	URL    string            `json:"url"`
	Scopes []string          `json:"scopes"`
	Params map[string]string `json:"params"`
}

// PluginID return the plugin ID
func (p *Plugin) PluginID() string {
	return p.ID
}

// StaticRoute -
type StaticRoute struct {
	PluginID  string
	Directory string
}

// StaticRoute generate the plugin static file route
func (p *Plugin) StaticRoute() *StaticRoute {
	if p.IsCorePlugin() {
		return nil
	}

	return &StaticRoute{Directory: p.PluginDir, PluginID: p.ID}
}

// IsPageApp checking the plugin whether is the page app plugin
func (p *Plugin) IsPageApp() bool {
	return p.Type == PageApp
}

// IsCorePlugin checking the plugin whether is the core plugin
func (p *Plugin) IsCorePlugin() bool {
	return p.Class == Core
}

// IsExternalPlugin checking the plugin whether is the external plugin
func (p *Plugin) IsExternalPlugin() bool {
	return p.Class == External
}

// Class -
type Class string

const (
	// Core plugin, the plugins belong to this class will be installed default.
	Core Class = "core"
	// External plugin, installed from the community registry.
	External Class = "external"
)

// PluginTypes plugin type definition
var PluginTypes = []Type{
	PageApp,
	Definition,
}

// Type the plugin type
type Type string

const (
	// PageApp means plugin provide a independent page. The route maybe like `/plugins/{pluginID}`
	PageApp Type = "page-app"
	// Definition means the plugin provides a UI component for the component，trait, workflow-step, and policy definitions.
	Definition Type = "definition"
)

// IsValid checking the plugin type
func (pt Type) IsValid() bool {
	switch pt {
	case PageApp:
		return true
	case Definition:
		return true
	}
	return false
}

// PluginSource the plugin source.
type PluginSource struct {
	Class Class
	Paths []string
}
