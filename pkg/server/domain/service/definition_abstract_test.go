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
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/types"
)

func definitionObject(kind, name string, spec map[string]interface{}) *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": definitionAPIVersion,
		"kind":       kind,
		"metadata":   map[string]interface{}{"name": name, "namespace": types.DefaultKubeVelaNS},
		"spec":       spec,
	}}
}

func TestListDefinitionsAbstract(t *testing.T) {
	workload := map[string]interface{}{"type": "deployments.apps"}
	// No Go types registered: the definitions stay unstructured, as an API server
	// serving a newer CRD returns fields the pinned KubeVela types lack.
	gvk := schema.FromAPIVersionAndKind(definitionAPIVersion, kindComponentDefinition)
	mapper := meta.NewDefaultRESTMapper(nil)
	mapper.Add(gvk, meta.RESTScopeNamespace)
	cli := fake.NewClientBuilder().WithScheme(runtime.NewScheme()).WithRESTMapper(mapper).WithObjects(
		definitionObject(kindComponentDefinition, "platform-base", map[string]interface{}{"workload": workload, "abstract": true}),
		definitionObject(kindComponentDefinition, "team-web", map[string]interface{}{"workload": workload, "extends": "platform-base"}),
		definitionObject(kindComponentDefinition, "worker", map[string]interface{}{"workload": workload}),
	).Build()
	d := &definitionServiceImpl{KubeClient: cli}

	names := func(queryAll bool) map[string][2]interface{} {
		defs, err := d.ListDefinitions(context.Background(), DefinitionQueryOption{Type: "component", QueryAll: queryAll})
		require.NoError(t, err)
		got := map[string][2]interface{}{}
		for _, def := range defs {
			got[def.Name] = [2]interface{}{def.Abstract, def.Extends}
		}
		return got
	}

	assert.Equal(t, map[string][2]interface{}{
		"team-web": {false, "platform-base"},
		"worker":   {false, ""},
	}, names(false), "an abstract definition is left out where a type is picked")
	assert.Equal(t, map[string][2]interface{}{
		"platform-base": {true, ""},
		"team-web":      {false, "platform-base"},
		"worker":        {false, ""},
	}, names(true), "the definitions page, which asks for all, sees it marked")
}
