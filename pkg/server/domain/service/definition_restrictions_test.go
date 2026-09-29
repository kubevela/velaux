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
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/utils/ptr"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/pkg/oam"
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
