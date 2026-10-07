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

// Package report runs reports: CUE that reads one project through the
// vela/report package and declares its table and chart with markers.
package report

import "context"

// Source is what a report may read: one project, and nothing beyond it.
type Source interface {
	// Apps are the project's applications.
	Apps(ctx context.Context) ([]App, error)
	// Components are the components and traits of the project's applications.
	Components(ctx context.Context) ([]Component, error)
	// Runs are the workflow runs of the project's applications.
	Runs(ctx context.Context) ([]WorkflowRun, error)
	// Environments are each application's environments: what is deployed there,
	// and whether the application as VelaUX would deploy it now differs.
	Environments(ctx context.Context) ([]Environment, error)
	// Definitions are the component and trait definitions and their versions.
	Definitions(ctx context.Context) ([]Definition, error)
	// List lists a kind in each of the project's namespaces, its environments'
	// and its targets', as the project.
	List(ctx context.Context, apiVersion, kind string) ([]Object, error)
}

// App is an application of the project.
type App struct {
	Name        string `json:"name"`
	Alias       string `json:"alias,omitempty"`
	Description string `json:"description,omitempty"`
}

// Component is a component, or a trait on one, with the expressions its
// properties hold.
type Component struct {
	App         string                 `json:"app"`
	Component   string                 `json:"component"`
	Kind        string                 `json:"kind"`
	Type        string                 `json:"type"`
	Properties  map[string]interface{} `json:"properties,omitempty"`
	Expressions []Expression           `json:"expressions,omitempty"`
}

// Expression is a property set by a $( ) expression.
type Expression struct {
	Property   string `json:"property"`
	Expression string `json:"expression"`
}

// WorkflowRun is a workflow run, and the revision it deployed.
type WorkflowRun struct {
	App      string `json:"app"`
	Env      string `json:"env,omitempty"`
	Workflow string `json:"workflow"`
	Name     string `json:"name"`
	Status   string `json:"status"`
	Started  string `json:"started,omitempty"`
	Finished string `json:"finished,omitempty"`
	// Seconds is how long the run took, or has taken so far.
	Seconds  int64     `json:"seconds"`
	Revision string    `json:"revision,omitempty"`
	User     string    `json:"user,omitempty"`
	Note     string    `json:"note,omitempty"`
	Trigger  string    `json:"trigger,omitempty"`
	Steps    []RunStep `json:"steps,omitempty"`
}

// RunStep is a step of a workflow run.
type RunStep struct {
	Name    string `json:"name"`
	Alias   string `json:"alias,omitempty"`
	Type    string `json:"type,omitempty"`
	Phase   string `json:"phase"`
	Message string `json:"message,omitempty"`
	Started string `json:"started,omitempty"`
	// Seconds is how long the step took, or has taken so far.
	Seconds int64 `json:"seconds"`
}

// Environment is an application's environment: the revision last deployed
// there, and whether the application as VelaUX would deploy it now differs.
type Environment struct {
	App        string `json:"app"`
	Env        string `json:"env"`
	Revision   string `json:"revision,omitempty"`
	Status     string `json:"status,omitempty"`
	DeployedAt string `json:"deployedAt,omitempty"`
	User       string `json:"user,omitempty"`
	Edited     bool   `json:"edited"`
}

// Definition is a component or trait definition: its latest version and every
// version it still has.
type Definition struct {
	Name     string   `json:"name"`
	Kind     string   `json:"kind"`
	Latest   string   `json:"latest,omitempty"`
	Versions []string `json:"versions"`
}

// Object is a resource in one of the project's namespaces.
type Object struct {
	Cluster   string                 `json:"cluster"`
	Namespace string                 `json:"namespace"`
	Object    map[string]interface{} `json:"object"`
}

type sourceKey struct{}

// WithSource is ctx carrying the project a report reads.
func WithSource(ctx context.Context, source Source) context.Context {
	return context.WithValue(ctx, sourceKey{}, source)
}

func sourceFrom(ctx context.Context) (Source, bool) {
	s, ok := ctx.Value(sourceKey{}).(Source)
	return s, ok
}
