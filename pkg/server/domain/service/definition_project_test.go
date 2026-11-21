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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	velatypes "github.com/oam-dev/kubevela/apis/types"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// projectDefinitionFixture: global webservice and worker in vela-system; the
// shop project's own webservice (alias "Shop web") in its namespace, shop; and
// another project's secret-type in other.
func projectDefinitionFixture(t *testing.T) (*definitionServiceImpl, client.Client) {
	t.Helper()
	ctx := context.Background()
	component := func(namespace, name, alias string) *v1beta1.ComponentDefinition {
		return &v1beta1.ComponentDefinition{
			ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace, Annotations: map[string]string{"definition.oam.dev/alias": alias}},
			Spec:       v1beta1.ComponentDefinitionSpec{Workload: common.WorkloadTypeDescriptor{Definition: common.WorkloadGVK{APIVersion: "apps/v1", Kind: "Deployment"}}},
		}
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(
		component("vela-system", "webservice", "Web service"),
		component("vela-system", "worker", "Worker"),
		component("shop", "webservice", "Shop web"),
		component("other", "secret-type", "Secret"),
	).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	for _, e := range []datastore.Entity{&model.Project{Name: "shop"}, &model.Project{Name: "other"}} {
		require.NoError(t, store.Add(ctx, e))
	}
	return &definitionServiceImpl{Store: store, KubeClient: cli, ServerKubeClient: cli}, cli
}

func byPlace(defs []*apisv1.DefinitionBase) map[string]*apisv1.DefinitionBase {
	out := map[string]*apisv1.DefinitionBase{}
	for _, d := range defs {
		out[d.Namespace+"/"+d.Name] = d
	}
	return out
}

func TestListDefinitionsByProject(t *testing.T) {
	d, _ := projectDefinitionFixture(t)
	ctx := context.Background()

	t.Run("without a project only the global ones are listed", func(t *testing.T) {
		defs, err := d.ListDefinitions(ctx, DefinitionQueryOption{Type: "component", QueryAll: true})
		require.NoError(t, err)
		assert.ElementsMatch(t, []string{"vela-system/webservice", "vela-system/worker"}, keys(byPlace(defs)))
	})

	t.Run("a project's own are listed with the global ones, which it overrides by name", func(t *testing.T) {
		defs, err := d.ListDefinitions(ctx, DefinitionQueryOption{Type: "component", QueryAll: true, Project: "shop"})
		require.NoError(t, err)
		got := byPlace(defs)
		assert.ElementsMatch(t, []string{"shop/webservice", "vela-system/webservice", "vela-system/worker"}, keys(got))
		assert.Equal(t, "project", got["shop/webservice"].Scope)
		assert.Equal(t, "global", got["vela-system/webservice"].Scope)
		assert.True(t, got["vela-system/webservice"].Overridden)
		assert.False(t, got["vela-system/worker"].Overridden)
	})

	t.Run("a picker for the project's namespace gets the project's one alone", func(t *testing.T) {
		defs, err := d.ListDefinitions(ctx, DefinitionQueryOption{Type: "component", Project: "shop", Namespaces: []string{"shop"}})
		require.NoError(t, err)
		got := byPlace(defs)
		assert.ElementsMatch(t, []string{"shop/webservice", "vela-system/worker"}, keys(got))
		assert.Empty(t, got["shop/webservice"].UnusableIn)
	})

	t.Run("a picker for another namespace gets the global one, as KubeVela finds no other there", func(t *testing.T) {
		defs, err := d.ListDefinitions(ctx, DefinitionQueryOption{Type: "component", Project: "shop", Namespaces: []string{"shop-prod"}})
		require.NoError(t, err)
		assert.ElementsMatch(t, []string{"vela-system/webservice", "vela-system/worker"}, keys(byPlace(defs)))
	})

	t.Run("a picker for both says where the project's one cannot be used", func(t *testing.T) {
		defs, err := d.ListDefinitions(ctx, DefinitionQueryOption{Type: "component", Project: "shop", Namespaces: []string{"shop", "shop-prod"}})
		require.NoError(t, err)
		got := byPlace(defs)
		assert.ElementsMatch(t, []string{"shop/webservice", "vela-system/worker"}, keys(got))
		assert.Equal(t, []string{"shop-prod"}, got["shop/webservice"].UnusableIn)
	})
}

func TestDefinitionPlace(t *testing.T) {
	d, cli := projectDefinitionFixture(t)
	alias := func(ctx context.Context, name string) (string, error) {
		detail, err := d.DetailDefinition(ctx, name, "component")
		if err != nil {
			return "", err
		}
		return detail.Alias, nil
	}
	shop := func(scope string) context.Context {
		return WithDefinitionScope(context.Background(), DefinitionScope{Project: "shop", Scope: scope})
	}

	t.Run("with no scope the project's one is found first, then the global one", func(t *testing.T) {
		got, err := alias(shop(""), "webservice")
		require.NoError(t, err)
		assert.Equal(t, "Shop web", got)
		got, err = alias(shop(""), "worker")
		require.NoError(t, err)
		assert.Equal(t, "Worker", got)
	})

	t.Run("a scope picks one", func(t *testing.T) {
		got, err := alias(shop("global"), "webservice")
		require.NoError(t, err)
		assert.Equal(t, "Web service", got)
		_, err = alias(shop("project"), "worker")
		assert.Equal(t, bcode.ErrDefinitionNotFound, err)
	})

	t.Run("without a project it is the global one, as before", func(t *testing.T) {
		got, err := alias(context.Background(), "webservice")
		require.NoError(t, err)
		assert.Equal(t, "Web service", got)
	})

	t.Run("another project's is never reached", func(t *testing.T) {
		_, err := alias(shop(""), "secret-type")
		assert.Equal(t, bcode.ErrDefinitionNotFound, err)
	})

	t.Run("hiding the project's one changes it, not the global one", func(t *testing.T) {
		_, err := d.UpdateDefinitionStatus(shop("project"), "webservice", apisv1.UpdateDefinitionStatusRequest{DefinitionType: "component", HiddenInUI: true})
		require.NoError(t, err)
		project, global := &v1beta1.ComponentDefinition{}, &v1beta1.ComponentDefinition{}
		require.NoError(t, cli.Get(context.Background(), types.NamespacedName{Namespace: "shop", Name: "webservice"}, project))
		require.NoError(t, cli.Get(context.Background(), types.NamespacedName{Namespace: "vela-system", Name: "webservice"}, global))
		assert.Equal(t, DefinitionHidden, project.Labels[velatypes.LabelDefinitionHidden])
		assert.NotContains(t, global.Labels, velatypes.LabelDefinitionHidden)
	})
}

func keys[V any](m map[string]V) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
