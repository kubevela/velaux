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

func policyDefinition(name string, spec map[string]interface{}) *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": definitionAPIVersion,
		"kind":       kindPolicyDefinition,
		"metadata":   map[string]interface{}{"name": name, "namespace": types.DefaultKubeVelaNS},
		"spec":       spec,
	}}
}

func TestListDefinitionsGlobalPolicies(t *testing.T) {
	mapper := meta.NewDefaultRESTMapper(nil)
	mapper.Add(schema.FromAPIVersionAndKind(definitionAPIVersion, kindPolicyDefinition), meta.RESTScopeNamespace)
	cli := fake.NewClientBuilder().WithScheme(runtime.NewScheme()).WithRESTMapper(mapper).WithObjects(
		policyDefinition("team-labels", map[string]interface{}{"scope": "Application", "global": true, "priority": int64(10)}),
		policyDefinition("add-sidecar", map[string]interface{}{"scope": "Application"}),
		policyDefinition("topology", map[string]interface{}{}),
	).Build()
	d := &definitionServiceImpl{KubeClient: cli}

	names := func(queryAll bool) []string {
		defs, err := d.ListDefinitions(context.Background(), DefinitionQueryOption{Type: "policy", QueryAll: queryAll})
		require.NoError(t, err)
		var got []string
		for _, def := range defs {
			got = append(got, def.Name)
		}
		sort.Strings(got)
		return got
	}

	assert.Equal(t, []string{"add-sidecar", "topology"}, names(false),
		"a global policy applies itself and an Application may not name it, so it is left out where a policy is picked")
	assert.Equal(t, []string{"add-sidecar", "team-labels", "topology"}, names(true), "the definitions page, which asks for all, sees it")
}

func TestPolicyScope(t *testing.T) {
	testCases := map[string]struct {
		name string
		spec map[string]interface{}
		want string
	}{
		"a policy KubeVela consumes itself":     {name: "topology", spec: map[string]interface{}{}, want: "Builtin"},
		"a policy rendered with the components": {name: "add-sidecar", spec: map[string]interface{}{}, want: "Workload"},
		"an application-scoped policy":          {name: "team-labels", spec: map[string]interface{}{"scope": "Application"}, want: "Application"},
		"a global policy, application-scoped":   {name: "org-labels", spec: map[string]interface{}{"scope": "Application", "global": true}, want: "Application"},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			base, err := convertDefinitionBase(*policyDefinition(tc.name, tc.spec), kindPolicyDefinition)
			require.NoError(t, err)
			assert.Equal(t, tc.want, base.PolicyScope)
		})
	}
}
