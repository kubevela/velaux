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
)

func TestListSourceDefinitionsWithoutTheCRD(t *testing.T) {
	// A KubeVela before 1.12 has no SourceDefinition CRD.
	mapper := meta.NewDefaultRESTMapper(nil)
	mapper.Add(schema.FromAPIVersionAndKind(definitionAPIVersion, kindComponentDefinition), meta.RESTScopeNamespace)
	cli := fake.NewClientBuilder().WithScheme(runtime.NewScheme()).WithRESTMapper(mapper).Build()
	d := &definitionServiceImpl{KubeClient: cli}
	defs, err := d.ListDefinitions(context.Background(), DefinitionQueryOption{Type: definitionTypeSource})
	require.NoError(t, err)
	assert.Empty(t, defs)
}
