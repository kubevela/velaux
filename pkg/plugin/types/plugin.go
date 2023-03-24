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

type BuildInfo struct {
	Time   int64  `json:"time,omitempty"`
	Repo   string `json:"repo,omitempty"`
	Branch string `json:"branch,omitempty"`
	Hash   string `json:"hash,omitempty"`
}

type InfoLink struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type Logos struct {
	Small string `json:"small"`
	Large string `json:"large"`
}

type Screenshots struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

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

type Dependencies struct {
	VelaUXDependency string       `json:"velauxDependency"`
	VelaUXVersion    string       `json:"velauxVersion"`
	Plugins          []Dependency `json:"plugins"`
}

type Dependency struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	Name    string `json:"name"`
	Version string `json:"version"`
}

// JSONData represents the plugin's plugin.json
type JSONData struct {
	ID           string       `json:"id"`
	Type         Type         `json:"type"`
	Name         string       `json:"name"`
	Info         Info         `json:"info"`
	Dependencies Dependencies `json:"dependencies"`
	Includes     []*Includes  `json:"includes"`
	Category     string       `json:"category"`
	HideFromList bool         `json:"hideFromList,omitempty"`
	Preload      bool         `json:"preload"`
	Backend      bool         `json:"backend"`
	Routes       []*Route     `json:"routes"`
}

type Includes struct {
	Name         string      `json:"name"`
	Label        string      `json:"label"`
	To           string      `json:"to"`
	Type         string      `json:"type"`
	Icon         string      `json:"icon"`
	Slug         string      `json:"slug"`
	Workspace    Workspace   `json:"workspace"`
	Permission   *Permission `json:"permission,omitempty"`
	RelatedRoute []string    `json:"relatedRoute"`
	Catalog      string      `json:"catalog,omitempty"`
}

type Workspace struct {
	Name string `json:"name"`
}

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
	Url    string            `json:"url"`
	Scopes []string          `json:"scopes"`
	Params map[string]string `json:"params"`
}

func (p *Plugin) PluginID() string {
	return p.ID
}

type StaticRoute struct {
	PluginID  string
	Directory string
}

func (p *Plugin) StaticRoute() *StaticRoute {
	if p.IsCorePlugin() {
		return nil
	}

	return &StaticRoute{Directory: p.PluginDir, PluginID: p.ID}
}

func (p *Plugin) IsPageApp() bool {
	return p.Type == PageApp
}

func (p *Plugin) IsCorePlugin() bool {
	return p.Class == Core
}

func (p *Plugin) IsExternalPlugin() bool {
	return p.Class == External
}

type Class string

const (
	Core     Class = "core"
	External Class = "external"
)

var PluginTypes = []Type{
	PageApp,
}

type Type string

const (
	PageApp Type = "page-app"
)

func (pt Type) IsValid() bool {
	switch pt {
	case PageApp:
		return true
	}
	return false
}

type PluginSource struct {
	Class Class
	Paths []string
}
