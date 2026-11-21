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

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func dependsMessage(t *testing.T, err error) string {
	t.Helper()
	var got *bcode.Bcode
	require.True(t, errors.As(err, &got), "got %v", err)
	assert.Equal(t, bcode.ErrComponentDependsOn.BusinessCode, got.BusinessCode)
	return got.Message
}

// dependsFixture is application shop with components api, db and cache,
// where api depends on db and db on cache.
func dependsFixture(t *testing.T) (*applicationServiceImpl, *model.Application) {
	t.Helper()
	ctx := context.Background()
	webservice := &v1beta1.ComponentDefinition{ObjectMeta: metav1.ObjectMeta{Name: "webservice", Namespace: "vela-system"}}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(webservice).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	app := &model.Application{Name: "shop"}
	for _, e := range []datastore.Entity{
		app,
		&model.ApplicationComponent{AppPrimaryKey: "shop", Name: "api", Type: "webservice", DependsOn: []string{"db"}},
		&model.ApplicationComponent{AppPrimaryKey: "shop", Name: "db", Type: "webservice", DependsOn: []string{"cache"}},
		&model.ApplicationComponent{AppPrimaryKey: "shop", Name: "cache", Type: "webservice"},
	} {
		require.NoError(t, store.Add(ctx, e))
	}
	return &applicationServiceImpl{Store: store, KubeClient: cli}, app
}

func storedDependsOn(t *testing.T, svc *applicationServiceImpl, name string) []string {
	t.Helper()
	component := &model.ApplicationComponent{AppPrimaryKey: "shop", Name: name}
	require.NoError(t, svc.Store.Get(context.Background(), component))
	return component.DependsOn
}

func TestComponentDependsOnIsChecked(t *testing.T) {
	ctx := context.Background()
	update := func(svc *applicationServiceImpl, app *model.Application, name string, dependsOn ...string) error {
		component := &model.ApplicationComponent{AppPrimaryKey: "shop", Name: name}
		require.NoError(t, svc.Store.Get(ctx, component))
		_, err := svc.UpdateComponent(ctx, app, component, apisv1.UpdateApplicationComponentRequest{DependsOn: &dependsOn})
		return err
	}

	t.Run("update: a dependsOn that closes a cycle is refused, naming it, and nothing is stored", func(t *testing.T) {
		svc, app := dependsFixture(t)
		err := update(svc, app, "cache", "api")
		assert.Equal(t, "components wait on each other in a cycle: cache -> api -> db -> cache", dependsMessage(t, err))
		assert.Empty(t, storedDependsOn(t, svc, "cache"))
	})

	t.Run("update: a component cannot depend on itself", func(t *testing.T) {
		svc, app := dependsFixture(t)
		err := update(svc, app, "cache", "cache")
		assert.Equal(t, "component cache cannot depend on itself", dependsMessage(t, err))
	})

	t.Run("update: a dependsOn naming no component of the application is refused", func(t *testing.T) {
		svc, app := dependsFixture(t)
		err := update(svc, app, "cache", "queue")
		assert.Equal(t, "component cache depends on queue, which is not a component of this application", dependsMessage(t, err))
	})

	t.Run("update: an acyclic dependsOn is stored", func(t *testing.T) {
		svc, app := dependsFixture(t)
		require.NoError(t, update(svc, app, "api", "db", "cache"))
		assert.Equal(t, []string{"db", "cache"}, storedDependsOn(t, svc, "api"))
	})

	t.Run("update: other fields alone are not checked against dependsOn", func(t *testing.T) {
		svc, app := dependsFixture(t)
		component := &model.ApplicationComponent{AppPrimaryKey: "shop", Name: "cache"}
		require.NoError(t, svc.Store.Get(ctx, component))
		alias := "Cache"
		_, err := svc.UpdateComponent(ctx, app, component, apisv1.UpdateApplicationComponentRequest{Alias: &alias})
		require.NoError(t, err)
	})

	t.Run("create: a new component may depend on existing ones, or on one not added yet, but not on itself", func(t *testing.T) {
		svc, app := dependsFixture(t)
		_, err := svc.CreateComponent(ctx, app, apisv1.CreateComponentRequest{Name: "worker", ComponentType: "webservice", DependsOn: []string{"api"}})
		require.NoError(t, err)
		_, err = svc.CreateComponent(ctx, app, apisv1.CreateComponentRequest{Name: "batch", ComponentType: "webservice", DependsOn: []string{"queue"}})
		require.NoError(t, err, "a component may be added before the one it depends on")
		_, err = svc.CreateComponent(ctx, app, apisv1.CreateComponentRequest{Name: "loop", ComponentType: "webservice", DependsOn: []string{"loop"}})
		assert.Equal(t, "component loop cannot depend on itself", dependsMessage(t, err))
	})

	t.Run("update: a cycle through inputs and outputs is refused, as kubevela refuses it", func(t *testing.T) {
		svc, app := dependsFixture(t)
		for _, c := range []*model.ApplicationComponent{
			{AppPrimaryKey: "shop", Name: "x", Type: "webservice", Outputs: wfTypesv1alpha1.StepOutputs{{Name: "x-url", ValueFrom: "output.url"}},
				Inputs: wfTypesv1alpha1.StepInputs{{From: "y-url", ParameterKey: "upstream"}}},
			{AppPrimaryKey: "shop", Name: "y", Type: "webservice", Outputs: wfTypesv1alpha1.StepOutputs{{Name: "y-url", ValueFrom: "output.url"}}},
		} {
			require.NoError(t, svc.Store.Add(ctx, c))
		}
		err := update(svc, app, "y", "x")
		assert.Equal(t, "components wait on each other in a cycle: y -> x -> y", dependsMessage(t, err))
	})

	t.Run("create: a new component closing a cycle through an existing input is refused", func(t *testing.T) {
		svc, app := dependsFixture(t)
		require.NoError(t, svc.Store.Add(ctx, &model.ApplicationComponent{AppPrimaryKey: "shop", Name: "gateway", Type: "webservice",
			Inputs: wfTypesv1alpha1.StepInputs{{From: "auth-url", ParameterKey: "auth"}}}))
		_, err := svc.CreateComponent(ctx, app, apisv1.CreateComponentRequest{Name: "auth", ComponentType: "webservice", DependsOn: []string{"gateway"},
			Outputs: wfTypesv1alpha1.StepOutputs{{Name: "auth-url", ValueFrom: "output.url"}}})
		assert.Equal(t, "components wait on each other in a cycle: auth -> gateway -> auth", dependsMessage(t, err))
	})
}
