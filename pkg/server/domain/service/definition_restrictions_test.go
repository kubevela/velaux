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
	"errors"
	"testing"

	pkgerrors "github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/validation/field"
	"k8s.io/utils/ptr"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/pkg/oam"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func componentDefinition(name string, restrictions map[string]interface{}, annotations map[string]string) unstructured.Unstructured {
	spec := map[string]interface{}{"workload": map[string]interface{}{"type": "deployments.apps"}}
	if restrictions != nil {
		spec["restrictions"] = restrictions
	}
	def := unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": definitionAPIVersion,
		"kind":       kindComponentDefinition,
		"metadata":   map[string]interface{}{"name": name},
		"spec":       spec,
	}}
	def.SetAnnotations(annotations)
	return def
}

func TestConvertDefinitionBaseRestrictions(t *testing.T) {
	testCases := map[string]struct {
		restrictions map[string]interface{}
		annotations  map[string]string
		want         *common.DefinitionRestrictions
	}{
		"none": {},
		"from the spec": {
			restrictions: map[string]interface{}{
				"namespaces":        []interface{}{"tenant-*"},
				"namespaceSelector": map[string]interface{}{"matchLabels": map[string]interface{}{"tier": "gold"}},
				"quota":             []interface{}{map[string]interface{}{"warn": int64(5), "limit": int64(10)}},
			},
			want: &common.DefinitionRestrictions{
				Namespaces:        []string{"tenant-*"},
				NamespaceSelector: &metav1.LabelSelector{MatchLabels: map[string]string{"tier": "gold"}},
				Quota:             []common.NamespaceQuota{{Warn: ptr.To[int32](5), Limit: ptr.To[int32](10)}},
			},
		},
		"from the annotation": {
			annotations: map[string]string{oam.AnnotationRestrictNamespaces: "dev,team-*"},
			want:        &common.DefinitionRestrictions{Namespaces: []string{"dev", "team-*"}},
		},
		"namespaces from the annotation, quota from the spec": {
			restrictions: map[string]interface{}{
				"quota": []interface{}{map[string]interface{}{"limit": int64(3)}},
			},
			annotations: map[string]string{oam.AnnotationRestrictNamespaces: "dev"},
			want: &common.DefinitionRestrictions{
				Namespaces: []string{"dev"},
				Quota:      []common.NamespaceQuota{{Limit: ptr.To[int32](3)}},
			},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			base, err := convertDefinitionBase(componentDefinition("web", tc.restrictions, tc.annotations), kindComponentDefinition)
			require.NoError(t, err)
			assert.Equal(t, tc.want, base.Restrictions)
		})
	}
}

func TestDeployApplyError(t *testing.T) {
	// As KubeVela's Application webhook refuses, wrapped as the applicator wraps it.
	webhook := pkgerrors.Wrap(apierrors.NewBadRequest(`admission webhook "applications.core.oam.dev" denied the request: `+"\n"+
		`  1) "spec.components[0].type": ComponentDefinition "gold-web" is restricted and cannot be used from namespace "team-dev". (requestUID=14b46999)`), "cannot create object")
	var code *bcode.Bcode
	require.ErrorAs(t, deployApplyError(webhook), &code)
	assert.Equal(t, bcode.ErrDeployApplyFail.BusinessCode, code.BusinessCode)
	assert.Contains(t, code.Message, `ComponentDefinition "gold-web" is restricted and cannot be used from namespace "team-dev"`)
	assert.NotContains(t, code.Message, "cannot create object")

	denied := apierrors.NewForbidden(schema.GroupResource{Group: "core.oam.dev", Resource: "applications"}, "app",
		errors.New(`admission webhook "validating.core.oam.dev.v1beta1.applications" denied the request: spec.components[0].type: Forbidden: ComponentDefinition "webservice" is restricted and cannot be used from namespace "prod"`))
	require.ErrorAs(t, deployApplyError(denied), &code)
	assert.Contains(t, code.Message, `ComponentDefinition "webservice" is restricted and cannot be used from namespace "prod"`)

	invalid := apierrors.NewInvalid(schema.GroupKind{Group: "core.oam.dev", Kind: "Application"}, "app", field.ErrorList{
		field.Forbidden(field.NewPath("spec", "components").Index(0).Child("type"), `this would exceed the quota for component type "webservice" in namespace "tenant-a"`),
	})
	require.ErrorAs(t, deployApplyError(invalid), &code)
	assert.Contains(t, code.Message, `this would exceed the quota for component type "webservice" in namespace "tenant-a"`)

	assert.Equal(t, bcode.ErrDeployApplyFail, deployApplyError(errors.New("dial tcp 10.0.0.1:443: i/o timeout")))
}

func TestMarkUnusableIn(t *testing.T) {
	reads := 0
	reader := fake.NewClientBuilder().WithObjects(
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "gold-a", Labels: map[string]string{"tier": "gold"}}},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "bronze-b", Labels: map[string]string{"tier": "bronze"}}},
	).WithInterceptorFuncs(interceptor.Funcs{Get: func(ctx context.Context, c client.WithWatch, key client.ObjectKey, obj client.Object, opts ...client.GetOption) error {
		reads++
		return c.Get(ctx, key, obj, opts...)
	}}).Build()
	defs := []*apisv1.DefinitionBase{
		{Name: "open"},
		{Name: "quota-only", Restrictions: &common.DefinitionRestrictions{Quota: []common.NamespaceQuota{{Limit: ptr.To[int32](1)}}}},
		{Name: "tenants", Restrictions: &common.DefinitionRestrictions{Namespaces: []string{"tenant-*"}}},
		{Name: "gold", Restrictions: &common.DefinitionRestrictions{NamespaceSelector: &metav1.LabelSelector{MatchLabels: map[string]string{"tier": "gold"}}}},
		{Name: "gold-or-tenant", Restrictions: &common.DefinitionRestrictions{
			Namespaces:        []string{"tenant-*"},
			NamespaceSelector: &metav1.LabelSelector{MatchLabels: map[string]string{"tier": "gold"}},
		}},
	}
	markUnusableIn(context.Background(), reader, defs, []string{"tenant-x", "gold-a", "bronze-b", "missing"})

	got := map[string][]string{}
	for _, def := range defs {
		got[def.Name] = def.UnusableIn
	}
	assert.Equal(t, map[string][]string{
		"open":           nil,
		"quota-only":     nil,
		"tenants":        {"gold-a", "bronze-b", "missing"},
		"gold":           {"tenant-x", "bronze-b", "missing"},
		"gold-or-tenant": {"bronze-b", "missing"},
	}, got)
	assert.Equal(t, 4, reads, "each namespace a selector needs is read once")
}
