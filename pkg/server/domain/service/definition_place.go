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

package service

import (
	"context"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/apis/types"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// Where a definition is: its project's namespace, or the system namespace.
const (
	definitionScopeProject = "project"
	definitionScopeGlobal  = "global"
)

// DefinitionScope is where a request's definition is looked for. Project
// names the project whose namespace holds its own; Scope is "project",
// "global", or empty for the project's one, else the global one, as KubeVela
// finds a definition for an Application in the project's namespace.
type DefinitionScope struct {
	Project string
	Scope   string
}

type definitionScopeKey struct{}

// WithDefinitionScope sets where the definition services called with ctx look.
// Without it they look in the system namespace alone.
func WithDefinitionScope(ctx context.Context, scope DefinitionScope) context.Context {
	return context.WithValue(ctx, definitionScopeKey{}, scope)
}

func definitionScopeFrom(ctx context.Context) DefinitionScope {
	scope, _ := ctx.Value(definitionScopeKey{}).(DefinitionScope)
	return scope
}

// definitionPlace is where a definition is read and written: a namespace and
// the client for it. A project's namespace is reached as VelaUX, behind
// VelaUX's project permissions, as a project's Kubernetes role holds no
// definitions; the system namespace as before.
type definitionPlace struct {
	namespace string
	cli       client.Client
}

// placeOf is where the definition kind/name of the request's scope is.
func (d *definitionServiceImpl) placeOf(ctx context.Context, kind, name string) (definitionPlace, error) {
	global := definitionPlace{namespace: types.DefaultKubeVelaNS, cli: d.KubeClient}
	scope := definitionScopeFrom(ctx)
	switch scope.Scope {
	case definitionScopeGlobal:
		return global, nil
	case definitionScopeProject, "":
	default:
		return definitionPlace{}, bcode.ErrDefinitionScope
	}
	if scope.Project == "" {
		if scope.Scope == definitionScopeProject {
			return definitionPlace{}, bcode.ErrProjectIsNotExist
		}
		return global, nil
	}
	namespace, err := projectNamespace(ctx, d.Store, scope.Project)
	if err != nil {
		return definitionPlace{}, err
	}
	project := definitionPlace{namespace: namespace, cli: d.ServerKubeClient}
	if scope.Scope == definitionScopeProject {
		return project, nil
	}
	def := &unstructured.Unstructured{}
	def.SetAPIVersion(definitionAPIVersion)
	def.SetKind(kind)
	err = project.cli.Get(ctx, client.ObjectKey{Namespace: namespace, Name: name}, def)
	if err == nil {
		return project, nil
	}
	if !apierrors.IsNotFound(err) {
		return definitionPlace{}, err
	}
	return global, nil
}

// withProjectDefinitions is the definitions a project can use: its own, then
// the global ones, each saying where it is and a global one saying whether one
// of the project's overrides it by name.
//
// A picker (not all) asks for the namespaces its Applications run in, and gets
// one definition per name: the project's where its namespace is among them,
// usable only there; else the global one, as KubeVela finds no other.
func withProjectDefinitions(project, global []*apisv1.DefinitionBase, projectNamespace string, namespaces []string, all bool) []*apisv1.DefinitionBase {
	own := map[string]bool{}
	for _, def := range project {
		def.Namespace, def.Scope = projectNamespace, definitionScopeProject
		own[def.Name] = true
	}
	for _, def := range global {
		def.Namespace, def.Scope = types.DefaultKubeVelaNS, definitionScopeGlobal
		def.Overridden = own[def.Name]
	}
	if all {
		return append(project, global...)
	}
	inProject := len(namespaces) == 0
	for _, ns := range namespaces {
		if ns == projectNamespace {
			inProject = true
		}
	}
	var out []*apisv1.DefinitionBase
	if inProject {
		for _, def := range project {
			for _, ns := range namespaces {
				if ns != projectNamespace {
					def.UnusableIn = append(def.UnusableIn, ns)
				}
			}
			out = append(out, def)
		}
	}
	for _, def := range global {
		if !inProject || !def.Overridden {
			out = append(out, def)
		}
	}
	return out
}
