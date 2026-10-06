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

package query

import (
	"context"
	"errors"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/selection"
	"k8s.io/apiserver/pkg/endpoints/request"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1 "k8s.io/api/core/v1"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam"
)

// ErrReadOnly is returned for any write: a view only reads.
var ErrReadOnly = errors.New("a view cannot change resources")

var resourceTrackers = schema.GroupResource{Group: v1beta1.Group, Resource: "resourcetrackers"}

// Guard is a read-only client for a project's queries. It reads as the user in
// the request's context, so Kubernetes decides what the project may see, with
// two exceptions a project's group cannot read for itself:
//   - ResourceTrackers, cluster-scoped, which say what an Application applied:
//     read as VelaUX, and only those of an Application in one of namespaces;
//   - Namespaces, listed as VelaUX, so a project can pick one for an
//     environment;
//   - the resource topology rules, ConfigMaps in vela-system that say how
//     kinds relate in a resource tree: platform configuration, listed as VelaUX.
func Guard(base client.Client, namespaces []string) client.Client {
	allowed := map[string]bool{}
	for _, ns := range namespaces {
		allowed[ns] = true
	}
	return &guard{Client: base, namespaces: allowed}
}

type guard struct {
	client.Client
	namespaces map[string]bool
}

// asVelaUX drops the user from ctx, so the request goes as VelaUX itself.
func asVelaUX(ctx context.Context) context.Context {
	return request.WithUser(ctx, nil)
}

func (g *guard) Get(ctx context.Context, key client.ObjectKey, obj client.Object, opts ...client.GetOption) error {
	if _, ok := obj.(*v1beta1.ResourceTracker); ok {
		if err := g.Client.Get(asVelaUX(ctx), key, obj, opts...); err != nil {
			return err
		}
		if !g.namespaces[obj.GetLabels()[oam.LabelAppNamespace]] {
			return apierrors.NewNotFound(resourceTrackers, key.Name)
		}
		return nil
	}
	return g.Client.Get(ctx, key, obj, opts...)
}

func (g *guard) List(ctx context.Context, list client.ObjectList, opts ...client.ListOption) error {
	switch kindOf(list) {
	case "ResourceTracker":
		o := &client.ListOptions{}
		o.ApplyOptions(opts)
		namespace := ""
		if o.LabelSelector != nil {
			namespace, _ = o.LabelSelector.RequiresExactMatch(oam.LabelAppNamespace)
		}
		if !g.namespaces[namespace] {
			return apierrors.NewForbidden(resourceTrackers, "", errors.New("only the ResourceTrackers of the project's applications can be read"))
		}
		return g.Client.List(asVelaUX(ctx), list, opts...)
	case "Namespace":
		return g.Client.List(asVelaUX(ctx), list, opts...)
	case "ConfigMap":
		if topologyRules(opts) {
			return g.Client.List(asVelaUX(ctx), list, opts...)
		}
	}
	return g.Client.List(ctx, list, opts...)
}

// topologyRules is whether a list asks for the resource topology rules: in
// vela-system, labelled as rules.
func topologyRules(opts []client.ListOption) bool {
	o := &client.ListOptions{}
	o.ApplyOptions(opts)
	if o.Namespace != types.DefaultKubeVelaNS || o.LabelSelector == nil {
		return false
	}
	requirements, _ := o.LabelSelector.Requirements()
	for _, r := range requirements {
		if r.Key() == oam.LabelResourceRules && r.Operator() == selection.Exists {
			return true
		}
	}
	return false
}

// kindOf is the kind a list holds.
func kindOf(list client.ObjectList) string {
	switch l := list.(type) {
	case *v1beta1.ResourceTrackerList:
		return "ResourceTracker"
	case *corev1.NamespaceList:
		return "Namespace"
	case *corev1.ConfigMapList:
		return "ConfigMap"
	case *unstructured.UnstructuredList:
		return strings.TrimSuffix(l.GetKind(), "List")
	}
	return ""
}

func (g *guard) Create(context.Context, client.Object, ...client.CreateOption) error {
	return ErrReadOnly
}

func (g *guard) Update(context.Context, client.Object, ...client.UpdateOption) error {
	return ErrReadOnly
}

func (g *guard) Patch(context.Context, client.Object, client.Patch, ...client.PatchOption) error {
	return ErrReadOnly
}

func (g *guard) Delete(context.Context, client.Object, ...client.DeleteOption) error {
	return ErrReadOnly
}

func (g *guard) DeleteAllOf(context.Context, client.Object, ...client.DeleteAllOfOption) error {
	return ErrReadOnly
}

func (g *guard) Status() client.SubResourceWriter {
	return refused{}
}

func (g *guard) SubResource(string) client.SubResourceClient {
	return refused{}
}

// refused is a sub-resource client that refuses everything.
type refused struct{}

func (refused) Get(context.Context, client.Object, client.Object, ...client.SubResourceGetOption) error {
	return ErrReadOnly
}

func (refused) Create(context.Context, client.Object, client.Object, ...client.SubResourceCreateOption) error {
	return ErrReadOnly
}

func (refused) Update(context.Context, client.Object, ...client.SubResourceUpdateOption) error {
	return ErrReadOnly
}

func (refused) Patch(context.Context, client.Object, client.Patch, ...client.SubResourcePatchOption) error {
	return ErrReadOnly
}
