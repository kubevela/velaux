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
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func componentRevision(name, version string, revision int64, def string) *v1beta1.DefinitionRevision {
	return &v1beta1.DefinitionRevision{
		ObjectMeta: metav1.ObjectMeta{Name: name + "-" + version, Namespace: types.DefaultKubeVelaNS},
		Spec: v1beta1.DefinitionRevisionSpec{
			Revision:            revision,
			RevisionHash:        "hash" + version,
			DefinitionType:      common.ComponentType,
			ComponentDefinition: v1beta1.ComponentDefinition{ObjectMeta: metav1.ObjectMeta{Name: def}},
		},
	}
}

func revisionSchema(name, image string) *v1.ConfigMap {
	return &v1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "component-schema-" + name, Namespace: types.DefaultKubeVelaNS},
		Data:       map[string]string{types.OpenapiV3JSONSchema: `{"properties":{"` + image + `":{"type":"string"}},"required":["` + image + `"],"type":"object"}`},
	}
}

func revisionsService(objs ...client.Object) *definitionServiceImpl {
	def := &v1beta1.ComponentDefinition{ObjectMeta: metav1.ObjectMeta{Name: "webapp", Namespace: types.DefaultKubeVelaNS}}
	return &definitionServiceImpl{KubeClient: fake.NewClientBuilder().WithScheme(common2.Scheme).
		WithObjects(append(objs, def)...).Build()}
}

func TestListDefinitionRevisions(t *testing.T) {
	ctx := context.Background()
	svc := revisionsService(
		componentRevision("webapp", "v1", 1, "webapp"),
		componentRevision("webapp", "v1.1.0", 2, "webapp"),
		componentRevision("webapp", "v2.0.0", 3, "webapp"),
		componentRevision("webapp-legacy", "v1", 1, "webapp-legacy"),
	)

	revisions, err := svc.ListDefinitionRevisions(ctx, "webapp", "component")
	require.NoError(t, err)
	var versions []string
	for _, r := range revisions {
		versions = append(versions, r.Version)
	}
	assert.Equal(t, []string{"v2.0.0", "v1.1.0", "v1"}, versions, "newest first, each as a type pins it after @")
	assert.Equal(t, int64(3), revisions[0].Revision)
	assert.Equal(t, "hashv2.0.0", revisions[0].Hash)

	none, err := svc.ListDefinitionRevisions(ctx, "webapp", "trait")
	require.NoError(t, err)
	assert.Empty(t, none, "a trait of the same name is another definition")
}

func TestDetailDefinitionAtRevision(t *testing.T) {
	ctx := context.Background()
	svc := revisionsService(revisionSchema("webapp", "image"), revisionSchema("webapp-v1", "repository"))

	latest, err := svc.DetailDefinitionAt(ctx, "webapp", "component", "")
	require.NoError(t, err)
	assert.Contains(t, latest.APISchema.Properties, "image", "no version is the latest")

	v1, err := svc.DetailDefinitionAt(ctx, "webapp", "component", "v1")
	require.NoError(t, err)
	assert.Contains(t, v1.APISchema.Properties, "repository", "a version's own parameters")
	assert.NotContains(t, v1.APISchema.Properties, "image")

	_, err = svc.DetailDefinitionAt(ctx, "webapp", "component", "v9")
	assert.Equal(t, bcode.ErrDefinitionNotFound, err, "a version with no revision")
}

func TestDefinitionName(t *testing.T) {
	assert.Equal(t, "webapp", definitionName("webapp@v1.1.0"))
	assert.Equal(t, "webapp", definitionName("webapp@v2"))
	assert.Equal(t, "webapp", definitionName("webapp"))
}
