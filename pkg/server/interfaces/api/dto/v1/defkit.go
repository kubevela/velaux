/*
Copyright 2026 The KubeVela Authors.

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

package v1

import "time"

// DefKitSource is where a DefKit module comes from and how it is rendered.
type DefKitSource struct {
	// Ref is the Go module path; Git is a repository URL in its place.
	Ref string `json:"ref,omitempty"`
	Git string `json:"git,omitempty"`
	// Version is a module version or, with Git, a branch, tag or commit.
	Version string   `json:"version,omitempty"`
	Prefix  string   `json:"prefix,omitempty"`
	Types   []string `json:"types,omitempty"`
}

// DefKitSettings are how a module is kept: what happens to its definitions
// when it no longer installs them, and whether it re-renders on its own.
type DefKitSettings struct {
	// DeletionPolicy is retain (the default) or delete: whether a definition
	// outlives the module, or its removal from the module.
	DeletionPolicy string `json:"deletionPolicy,omitempty"`
	// Overrides set the policy of single definitions, by Kind/name.
	Overrides map[string]string `json:"overrides,omitempty"`
	// AutoUpdate re-renders and applies the module every Interval, with no review.
	AutoUpdate bool `json:"autoUpdate,omitempty"`
	// Interval is a Go duration, 10m when empty.
	Interval string `json:"interval,omitempty"`
}

// DefKitModuleInfo is what a module says about itself in its module.yaml, as
// its last render read it.
type DefKitModuleInfo struct {
	Name            string             `json:"name"`
	ResolvedVersion string             `json:"resolvedVersion,omitempty"`
	Description     string             `json:"description,omitempty"`
	Maintainers     []DefKitMaintainer `json:"maintainers,omitempty"`
	Categories      []string           `json:"categories,omitempty"`
	HasHooks        bool               `json:"hasHooks,omitempty"`
}

// DefKitMaintainer is a maintainer a module lists.
type DefKitMaintainer struct {
	Name  string `json:"name"`
	Email string `json:"email,omitempty"`
}

// DefKitModule is an installed module: an Application of the defkit addon.
type DefKitModule struct {
	Name     string         `json:"name"`
	Source   DefKitSource   `json:"source"`
	Settings DefKitSettings `json:"settings"`
	// NextUpdate is when an auto-updating module renders next.
	NextUpdate *time.Time `json:"nextUpdate,omitempty"`
	// Phase is rendering, review, applying, applied or failed.
	Phase   string            `json:"phase"`
	Message string            `json:"message,omitempty"`
	Info    *DefKitModuleInfo `json:"info,omitempty"`
	// Counts are the installed definitions by kind.
	Counts     map[string]int `json:"counts"`
	UpdateTime time.Time      `json:"updateTime"`
}

// ListDefKitModulesResponse lists the installed modules.
type ListDefKitModulesResponse struct {
	// AddonEnabled is whether the defkit addon's steps are installed.
	AddonEnabled bool            `json:"addonEnabled"`
	Modules      []*DefKitModule `json:"modules"`
}

// DefKitDefinition is one definition of a module.
type DefKitDefinition struct {
	Kind        string `json:"kind"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	// Policy is its deletion policy: its override, or the module's.
	Policy string `json:"policy,omitempty"`
}

// DefKitModuleDetail is a module, the definitions it has installed, and the
// Application that installs them.
type DefKitModuleDetail struct {
	DefKitModule
	Definitions []*DefKitDefinition `json:"definitions"`
	Application *DefKitApplication  `json:"application"`
}

// DefKitApplication is the Application a module is: its workflow as far as it
// has run, and every resource it tracks.
type DefKitApplication struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Phase     string            `json:"phase,omitempty"`
	Steps     []*DefKitStep     `json:"steps"`
	Resources []*DefKitResource `json:"resources"`
}

// DefKitStep is one step of a module's workflow.
type DefKitStep struct {
	Name      string     `json:"name"`
	Type      string     `json:"type,omitempty"`
	Phase     string     `json:"phase,omitempty"`
	Message   string     `json:"message,omitempty"`
	StartTime *time.Time `json:"startTime,omitempty"`
	EndTime   *time.Time `json:"endTime,omitempty"`
}

// DefKitResource is a resource a module's Application tracks.
type DefKitResource struct {
	APIVersion string `json:"apiVersion"`
	Kind       string `json:"kind"`
	Name       string `json:"name"`
	Namespace  string `json:"namespace,omitempty"`
}

// DefKitPreviewItem is one definition a render would change, or leave.
type DefKitPreviewItem struct {
	DefKitDefinition
	// Status is new, changed, unchanged, conflict (exists, not from this
	// module) or removed (installed, no longer rendered).
	Status string `json:"status"`
	// Current and Next are the definition's YAML in the cluster and as rendered.
	Current string `json:"current,omitempty"`
	Next    string `json:"next,omitempty"`
}

// DefKitPreview is a module's pending render against the cluster.
type DefKitPreview struct {
	// Phase is the module's: a preview is ready to apply in review.
	Phase   string               `json:"phase"`
	Message string               `json:"message,omitempty"`
	Info    *DefKitModuleInfo    `json:"info,omitempty"`
	Errors  []string             `json:"errors,omitempty"`
	Items   []*DefKitPreviewItem `json:"items"`
}

// CreateDefKitModuleRequest installs a module.
type CreateDefKitModuleRequest struct {
	Name string `json:"name" validate:"checkname"`
	DefKitSource
	DefKitSettings
}

// UpdateDefKitModuleRequest changes a module's source or settings.
type UpdateDefKitModuleRequest struct {
	DefKitSource
	DefKitSettings
}

// ApplyDefKitPreviewRequest applies a module's pending render.
type ApplyDefKitPreviewRequest struct {
	// TakeOver are the conflicts to take over, as Kind/name; the rest are left alone.
	TakeOver []string `json:"takeOver,omitempty"`
	// Delete are the removed definitions to delete, as Kind/name; the rest are kept.
	Delete []string `json:"delete,omitempty"`
}

// DefKitRepository is a module source offered when adding one, from the
// defkit addon's settings.
type DefKitRepository struct {
	Name        string `json:"name"`
	Git         string `json:"git,omitempty"`
	Ref         string `json:"ref,omitempty"`
	Version     string `json:"version,omitempty"`
	Description string `json:"description,omitempty"`
}

// ListDefKitRepositoriesResponse lists the repositories offered.
type ListDefKitRepositoriesResponse struct {
	Repositories []*DefKitRepository `json:"repositories"`
}
