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
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/types"
)

// Modules are still in development, and VelaUX cannot yet name a module's types the way
// KubeVela requires, so their definitions are left out of every list.
func TestModuleDefinitionsAreNotListed(t *testing.T) {
	workload := map[string]interface{}{"type": "deployments.apps"}
	gvk := schema.FromAPIVersionAndKind(definitionAPIVersion, kindComponentDefinition)
	mapper := meta.NewDefaultRESTMapper(nil)
	mapper.Add(gvk, meta.RESTScopeNamespace)
	fromModule := definitionObject(kindComponentDefinition, "cache-v1-redis", map[string]interface{}{"workload": workload})
	fromModule.SetLabels(map[string]string{types.LabelDefinitionModule: "cache", types.LabelDefinitionName: "redis"})
	cli := fake.NewClientBuilder().WithScheme(runtime.NewScheme()).WithRESTMapper(mapper).WithObjects(
		fromModule,
		definitionObject(kindComponentDefinition, "worker", map[string]interface{}{"workload": workload}),
	).Build()
	d := &definitionServiceImpl{KubeClient: cli}

	for _, queryAll := range []bool{false, true} {
		defs, err := d.ListDefinitions(context.Background(), DefinitionQueryOption{Type: "component", QueryAll: queryAll})
		require.NoError(t, err)
		var names []string
		for _, def := range defs {
			names = append(names, def.Name)
		}
		assert.Equal(t, []string{"worker"}, names, "queryAll=%t", queryAll)
	}
}
