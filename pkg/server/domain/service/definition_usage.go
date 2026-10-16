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
	"sort"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	velacache "github.com/oam-dev/kubevela/pkg/cache"
	"github.com/oam-dev/kubevela/pkg/definition/nsrestrict"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// DefinitionUsage reports each namespace's use of a component or trait
// definition against its quota. Only those two kinds carry a quota.
func (d *definitionServiceImpl) DefinitionUsage(ctx context.Context, name, defType string) (*apisv1.DefinitionUsageResponse, error) {
	if defType != velacache.UsageComponent && defType != velacache.UsageTrait {
		return nil, bcode.ErrDefinitionTypeNotSupport
	}
	version, kind, err := getKindAndVersion(defType)
	if err != nil {
		return nil, err
	}
	def := &unstructured.Unstructured{}
	def.SetAPIVersion(version)
	def.SetKind(kind)
	place, err := d.placeOf(ctx, kind, name)
	if err != nil {
		return nil, err
	}
	if err := place.cli.Get(ctx, client.ObjectKey{Namespace: place.namespace, Name: name}, def); err != nil {
		return nil, err
	}
	var apps v1beta1.ApplicationList
	opts := []client.ListOption{}
	if place.namespace != types.DefaultKubeVelaNS {
		// KubeVela finds a project's definition for Applications in its namespace alone.
		opts = append(opts, client.InNamespace(place.namespace))
	}
	if err := d.KubeClient.List(ctx, &apps, opts...); err != nil {
		return nil, err
	}
	namespaces := map[string]corev1.Namespace{}
	for _, app := range apps.Items {
		if _, read := namespaces[app.Namespace]; read || usageInApp(&app, defType, name) == 0 {
			continue
		}
		// VelaUX's own identity, as for restrictions: the webhook reads the
		// Namespace with its own.
		var ns corev1.Namespace
		if err := d.ServerKubeClient.Get(ctx, client.ObjectKey{Name: app.Namespace}, &ns); err != nil {
			klog.V(4).Infof("cannot read namespace %s for definition quota: %v", app.Namespace, err)
		}
		namespaces[app.Namespace] = ns
	}
	return &apisv1.DefinitionUsageResponse{Usage: definitionUsage(def, defType, name, apps.Items, namespaces)}, nil
}

// definitionUsage counts a definition's uses in each namespace that has any,
// as the Application webhook counts them, and compares each count with the
// quota entry governing the namespace.
func definitionUsage(def client.Object, defType, name string, apps []v1beta1.Application, namespaces map[string]corev1.Namespace) []apisv1.NamespaceUsage {
	used := map[string]int{}
	for i := range apps {
		if n := usageInApp(&apps[i], defType, name); n > 0 {
			used[apps[i].Namespace] += n
		}
	}
	var usage []apisv1.NamespaceUsage
	for nsName, count := range used {
		ns := namespaces[nsName]
		row := apisv1.NamespaceUsage{Namespace: nsName, Used: count, State: apisv1.UsageStateUnlimited}
		if q := nsrestrict.QuotaFor(def, nsName, ns.Labels); q != nil {
			row.Warn, row.Limit = q.Warn, q.Limit
			refuse, warn := nsrestrict.ExceedsQuota(q, count)
			switch {
			case nsrestrict.QuotaExempt(ns.Annotations):
				row.State = apisv1.UsageStateExempt
			case refuse:
				row.State = apisv1.UsageStateOver
			case warn:
				row.State = apisv1.UsageStateWarn
			default:
				row.State = apisv1.UsageStateOK
			}
		}
		usage = append(usage, row)
	}
	sort.Slice(usage, func(i, j int) bool { return usage[i].Namespace < usage[j].Namespace })
	return usage
}

// usageInApp counts a definition's occurrences in one Application, as the
// webhook does: each component of the type once, each trait of the type once
// per component carrying it, a version pin (type@v2) counting as the type.
func usageInApp(app *v1beta1.Application, defType, name string) int {
	n := 0
	for _, comp := range app.Spec.Components {
		if defType == velacache.UsageComponent {
			if velacache.BaseTypeName(comp.Type) == name {
				n++
			}
			continue
		}
		for _, tr := range comp.Traits {
			if velacache.BaseTypeName(tr.Type) == name {
				n++
			}
		}
	}
	return n
}
