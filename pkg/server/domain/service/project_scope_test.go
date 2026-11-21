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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// componentTypeFixture is project shop (namespace shop) with application
// storefront. Component types: storefront-web in shop only, legacy in
// vela-system only, and webservice in both, told apart by workload type.
func componentTypeFixture(t *testing.T) (*applicationServiceImpl, *model.Application) {
	t.Helper()
	ctx := context.Background()
	definition := func(namespace, name, workload string) *v1beta1.ComponentDefinition {
		return &v1beta1.ComponentDefinition{
			ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
			Spec:       v1beta1.ComponentDefinitionSpec{Workload: common.WorkloadTypeDescriptor{Type: workload}},
		}
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(
		definition("shop", "storefront-web", "shop-web"),
		definition("vela-system", "legacy", "global-legacy"),
		definition("shop", "webservice", "shop-webservice"),
		definition("vela-system", "webservice", "global-webservice"),
	).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	app := &model.Application{Name: "storefront", Project: "shop"}
	for _, e := range []datastore.Entity{&model.Project{Name: "shop"}, app} {
		require.NoError(t, store.Add(ctx, e))
	}
	return &applicationServiceImpl{Store: store, KubeClient: cli, ServerKubeClient: cli}, app
}

func TestProjectComponentTypes(t *testing.T) {
	ctx := context.Background()

	t.Run("a project's own component type can be added", func(t *testing.T) {
		svc, app := componentTypeFixture(t)
		base, err := svc.CreateComponent(ctx, app, apisv1.CreateComponentRequest{Name: "web", ComponentType: "storefront-web"})
		require.NoError(t, err)
		assert.Equal(t, "storefront-web", base.ComponentType)
	})

	t.Run("its detail carries its definition", func(t *testing.T) {
		svc, app := componentTypeFixture(t)
		_, err := svc.CreateComponent(ctx, app, apisv1.CreateComponentRequest{Name: "web", ComponentType: "storefront-web"})
		require.NoError(t, err)
		detail, err := svc.DetailComponent(ctx, app, "web")
		require.NoError(t, err)
		assert.Equal(t, "shop-web", detail.Definition.Workload.Type)
	})

	t.Run("a global component type is still found", func(t *testing.T) {
		svc, app := componentTypeFixture(t)
		_, err := svc.CreateComponent(ctx, app, apisv1.CreateComponentRequest{Name: "old", ComponentType: "legacy"})
		require.NoError(t, err)
		detail, err := svc.DetailComponent(ctx, app, "old")
		require.NoError(t, err)
		assert.Equal(t, "global-legacy", detail.Definition.Workload.Type)
	})

	t.Run("the project's overrides a global one of the same name", func(t *testing.T) {
		svc, app := componentTypeFixture(t)
		_, err := svc.CreateComponent(ctx, app, apisv1.CreateComponentRequest{Name: "web", ComponentType: "webservice"})
		require.NoError(t, err)
		detail, err := svc.DetailComponent(ctx, app, "web")
		require.NoError(t, err)
		assert.Equal(t, "shop-webservice", detail.Definition.Workload.Type)
	})

	t.Run("a type in neither namespace is refused", func(t *testing.T) {
		svc, app := componentTypeFixture(t)
		_, err := svc.CreateComponent(ctx, app, apisv1.CreateComponentRequest{Name: "x", ComponentType: "nosuch"})
		assertCode(t, err, bcode.ErrComponentTypeNotSupport)
	})
}

// assertCode asserts err is the business error want, whatever its message.
func assertCode(t *testing.T, err error, want *bcode.Bcode) {
	t.Helper()
	var got *bcode.Bcode
	if assert.True(t, errors.As(err, &got), "got %v", err) {
		assert.Equal(t, want.BusinessCode, got.BusinessCode, "got %v", err)
	}
}

// storedRef is the ref the store holds for the workflow named name of app.
func storedRef(t *testing.T, w *workflowServiceImpl, app, name string) string {
	t.Helper()
	wf := &model.Workflow{AppPrimaryKey: app, Name: name}
	require.NoError(t, w.Store.Get(context.Background(), wf))
	return wf.Ref
}

func TestSharedWorkflowRefChecked(t *testing.T) {
	ctx := context.Background()
	app := &model.Application{Name: "storefront", Project: "shop"}

	t.Run("update: a project's shared workflow is refused outside its namespace, and nothing is stored", func(t *testing.T) {
		_, w, _ := sharedWorkflowFixture(t, ref("storefront", "workflow-dev", "dev", ""))
		wf := &model.Workflow{AppPrimaryKey: "storefront", Name: "workflow-dev"}
		require.NoError(t, w.Store.Get(ctx, wf))
		_, err := w.UpdateWorkflow(ctx, wf, apisv1.UpdateWorkflowRequest{Ref: "hotfix"})
		assertCode(t, err, bcode.ErrSharedWorkflowUnreachable)
		assert.Equal(t, "", storedRef(t, w, "storefront", "workflow-dev"))
	})

	t.Run("update: a ref found nowhere is refused, and nothing is stored", func(t *testing.T) {
		_, w, _ := sharedWorkflowFixture(t, ref("storefront", "workflow-dev", "dev", ""))
		wf := &model.Workflow{AppPrimaryKey: "storefront", Name: "workflow-dev"}
		require.NoError(t, w.Store.Get(ctx, wf))
		_, err := w.UpdateWorkflow(ctx, wf, apisv1.UpdateWorkflowRequest{Ref: "nosuch"})
		assertCode(t, err, bcode.ErrSharedWorkflowUnreachable)
		assert.Equal(t, "", storedRef(t, w, "storefront", "workflow-dev"))
	})

	t.Run("update: a project's shared workflow is accepted in its namespace", func(t *testing.T) {
		_, w, _ := sharedWorkflowFixture(t, ref("storefront", "workflow-production", "production", ""))
		wf := &model.Workflow{AppPrimaryKey: "storefront", Name: "workflow-production"}
		require.NoError(t, w.Store.Get(ctx, wf))
		_, err := w.UpdateWorkflow(ctx, wf, apisv1.UpdateWorkflowRequest{Ref: "hotfix"})
		require.NoError(t, err)
		assert.Equal(t, "hotfix", storedRef(t, w, "storefront", "workflow-production"))
	})

	t.Run("update: a global shared workflow is accepted anywhere", func(t *testing.T) {
		_, w, _ := sharedWorkflowFixture(t, ref("storefront", "workflow-dev", "dev", ""))
		wf := &model.Workflow{AppPrimaryKey: "storefront", Name: "workflow-dev"}
		require.NoError(t, w.Store.Get(ctx, wf))
		_, err := w.UpdateWorkflow(ctx, wf, apisv1.UpdateWorkflowRequest{Ref: "standard"})
		require.NoError(t, err)
		assert.Equal(t, "standard", storedRef(t, w, "storefront", "workflow-dev"))
	})

	t.Run("create: an unreachable ref is refused, and no workflow is created", func(t *testing.T) {
		_, w, _ := sharedWorkflowFixture(t)
		_, err := w.CreateOrUpdateWorkflow(ctx, app, apisv1.CreateWorkflowRequest{Name: "workflow-dev", EnvName: "dev", Ref: "hotfix"})
		assertCode(t, err, bcode.ErrSharedWorkflowUnreachable)
		err = w.Store.Get(ctx, &model.Workflow{AppPrimaryKey: "storefront", Name: "workflow-dev"})
		assert.True(t, errors.Is(err, datastore.ErrRecordNotExist), "got %v", err)
	})

	t.Run("create: an existing workflow keeps its steps when the ref is refused", func(t *testing.T) {
		_, w, _ := sharedWorkflowFixture(t, ref("storefront", "workflow-dev", "dev", "standard"))
		_, err := w.CreateOrUpdateWorkflow(ctx, app, apisv1.CreateWorkflowRequest{Name: "workflow-dev", EnvName: "dev", Ref: "hotfix"})
		assertCode(t, err, bcode.ErrSharedWorkflowUnreachable)
		assert.Equal(t, "standard", storedRef(t, w, "storefront", "workflow-dev"))
	})

	t.Run("create: a workflow with its own steps needs no lookup", func(t *testing.T) {
		_, w, _ := sharedWorkflowFixture(t)
		_, err := w.CreateOrUpdateWorkflow(ctx, app, apisv1.CreateWorkflowRequest{Name: "workflow-dev", EnvName: "dev"})
		require.NoError(t, err)
	})
}
