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

	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// sharedWorkflowFixture is project shop (namespace shop) with environments
// production (in shop) and dev (in shop-dev), and project other with
// environment other (in other). Workflows: shop/release, shop/hotfix,
// vela-system/release, vela-system/standard.
func sharedWorkflowFixture(t *testing.T, refs ...*model.Workflow) (*sharedWorkflowServiceImpl, *workflowServiceImpl, client.Client) {
	t.Helper()
	ctx := context.Background()
	workflow := func(namespace, name string) *wfTypesv1alpha1.Workflow {
		return &wfTypesv1alpha1.Workflow{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace}}
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(
		workflow("shop", "release"), workflow("shop", "hotfix"),
		workflow("vela-system", "release"), workflow("vela-system", "standard"),
	).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	entities := []datastore.Entity{
		&model.Project{Name: "shop"},
		&model.Project{Name: "other"},
		&model.Env{Name: "production", Project: "shop", Namespace: "shop"},
		&model.Env{Name: "dev", Project: "shop", Namespace: "shop-dev"},
		&model.Env{Name: "other", Project: "other", Namespace: "other"},
		&model.Application{Name: "storefront", Alias: "Storefront", Project: "shop"},
		&model.Application{Name: "secret", Project: "other"},
	}
	for _, r := range refs {
		entities = append(entities, r)
	}
	for _, e := range entities {
		require.NoError(t, store.Add(ctx, e))
	}
	return &sharedWorkflowServiceImpl{Store: store, KubeClient: cli, ServerKubeClient: cli},
		&workflowServiceImpl{Store: store, KubeClient: cli, ServerKubeClient: cli},
		cli
}

func ref(app, name, env, sharedName string) *model.Workflow {
	return &model.Workflow{AppPrimaryKey: app, Name: name, EnvName: env, Ref: sharedName}
}

func byScopeName(shared []apisv1.SharedWorkflow) map[string]apisv1.SharedWorkflow {
	out := map[string]apisv1.SharedWorkflow{}
	for _, s := range shared {
		out[s.Scope+"/"+s.Name] = s
	}
	return out
}

func TestListSharedWorkflowsForProject(t *testing.T) {
	s, _, _ := sharedWorkflowFixture(t,
		ref("storefront", "storefront-production", "production", "release"),
		ref("storefront", "storefront-dev", "dev", "release"),
		ref("secret", "secret-other", "other", "standard"),
	)
	resp, err := s.ListSharedWorkflows(context.Background(), "shop")
	require.NoError(t, err)
	got := byScopeName(resp.Workflows)
	require.Len(t, got, 4)
	assert.Equal(t, "shop", resp.ProjectNamespace)

	t.Run("a global one is hidden where the project has one of its name", func(t *testing.T) {
		assert.True(t, got["global/release"].Hidden)
		assert.False(t, got["global/standard"].Hidden)
	})

	t.Run("a ref counts where KubeVela resolves it, from the environment's namespace", func(t *testing.T) {
		project := got["project/release"].UsedBy
		require.Len(t, project, 1)
		assert.Equal(t, apisv1.SharedWorkflowUse{AppName: "storefront", AppAlias: "Storefront", WorkflowName: "storefront-production", EnvName: "production"}, project[0])
		global := got["global/release"].UsedBy
		require.Len(t, global, 1, "dev runs in shop-dev, which has no release, so it runs the global one")
		assert.Equal(t, "storefront-dev", global[0].WorkflowName)
	})

	t.Run("another project's use is counted, not named", func(t *testing.T) {
		assert.Empty(t, got["global/standard"].UsedBy)
		assert.Equal(t, 1, got["global/standard"].UsedElsewhere)
	})
}

func TestSharedWorkflowLifecycle(t *testing.T) {
	ctx := context.Background()
	s, _, cli := sharedWorkflowFixture(t)
	req := apisv1.SharedWorkflowRequest{
		Name:        "canary",
		Alias:       "Canary",
		Description: "Deploy, then wait",
		Mode:        "DAG",
		SubMode:     "StepByStep",
		Steps: []apisv1.WorkflowStep{
			{WorkflowStepBase: apisv1.WorkflowStepBase{Name: "deploy", Type: "deploy"}},
			{WorkflowStepBase: apisv1.WorkflowStepBase{Name: "wait", Type: "suspend", DependsOn: []string{"deploy"}}},
		},
	}

	t.Run("a project one is written to the project's namespace", func(t *testing.T) {
		created, err := s.CreateSharedWorkflow(ctx, "shop", "project", req)
		require.NoError(t, err)
		assert.Equal(t, "shop", created.Namespace)
		wf := &wfTypesv1alpha1.Workflow{}
		require.NoError(t, cli.Get(ctx, types.NamespacedName{Namespace: "shop", Name: "canary"}, wf))
		assert.Equal(t, "Canary", wf.Annotations[annoSharedWorkflowAlias])
		assert.Equal(t, wfTypesv1alpha1.WorkflowMode("DAG"), wf.Mode.Steps)
		require.Len(t, wf.Steps, 2)
		assert.Equal(t, []string{"deploy"}, wf.Steps[1].DependsOn)
	})

	t.Run("a name already in the scope is refused", func(t *testing.T) {
		_, err := s.CreateSharedWorkflow(ctx, "shop", "project", req)
		assert.Equal(t, bcode.ErrSharedWorkflowExists, err)
	})

	t.Run("detail reads back what was written", func(t *testing.T) {
		detail, err := s.DetailSharedWorkflow(ctx, "shop", "project", "canary")
		require.NoError(t, err)
		assert.Equal(t, "Canary", detail.Alias)
		assert.Equal(t, "Deploy, then wait", detail.Description)
		assert.Equal(t, "DAG", detail.Mode)
		assert.Equal(t, "StepByStep", detail.SubMode)
		assert.Len(t, detail.Steps, 2)
	})

	t.Run("update replaces the fields VelaUX owns and keeps other annotations", func(t *testing.T) {
		wf := &wfTypesv1alpha1.Workflow{}
		require.NoError(t, cli.Get(ctx, types.NamespacedName{Namespace: "shop", Name: "canary"}, wf))
		wf.Annotations["team"] = "payments"
		require.NoError(t, cli.Update(ctx, wf))

		next := req
		next.Alias, next.Mode, next.SubMode = "", "", ""
		next.Steps = req.Steps[:1]
		_, err := s.UpdateSharedWorkflow(ctx, "shop", "project", "canary", next)
		require.NoError(t, err)
		require.NoError(t, cli.Get(ctx, types.NamespacedName{Namespace: "shop", Name: "canary"}, wf))
		assert.NotContains(t, wf.Annotations, annoSharedWorkflowAlias)
		assert.Equal(t, "payments", wf.Annotations["team"])
		assert.Nil(t, wf.Mode, "no modes means KubeVela's defaults")
		assert.Len(t, wf.Steps, 1)
	})

	t.Run("a global one is written to the system namespace", func(t *testing.T) {
		created, err := s.CreateSharedWorkflow(ctx, "shop", "global", req)
		require.NoError(t, err)
		assert.Equal(t, "vela-system", created.Namespace)
	})

	t.Run("an unknown scope is refused", func(t *testing.T) {
		_, err := s.CreateSharedWorkflow(ctx, "shop", "environment", req)
		assert.Equal(t, bcode.ErrSharedWorkflowScope, err)
		_, err = s.DetailSharedWorkflow(ctx, "shop", "", "canary")
		assert.Equal(t, bcode.ErrSharedWorkflowScope, err)
	})

	t.Run("an unused one is deleted", func(t *testing.T) {
		require.NoError(t, s.DeleteSharedWorkflow(ctx, "shop", "project", "canary"))
		_, err := s.DetailSharedWorkflow(ctx, "shop", "project", "canary")
		assert.Equal(t, bcode.ErrSharedWorkflowNotFound, err)
	})
}

func TestDeleteSharedWorkflowInUse(t *testing.T) {
	ctx := context.Background()
	s, _, _ := sharedWorkflowFixture(t,
		ref("storefront", "storefront-production", "production", "release"),
		ref("secret", "secret-other", "other", "standard"),
	)
	assert.Equal(t, bcode.ErrSharedWorkflowInUse, s.DeleteSharedWorkflow(ctx, "shop", "project", "release"))
	assert.Equal(t, bcode.ErrSharedWorkflowInUse, s.DeleteSharedWorkflow(ctx, "shop", "global", "standard"),
		"another project's use blocks it too")
	assert.NoError(t, s.DeleteSharedWorkflow(ctx, "shop", "global", "release"),
		"production resolves release in shop, so the global one is unused")
}

func TestSharedWorkflowsForEnvironment(t *testing.T) {
	ctx := context.Background()
	_, w, _ := sharedWorkflowFixture(t)

	t.Run("in the project's namespace the project's are usable and hide global ones", func(t *testing.T) {
		resp, err := w.ListSharedWorkflows(ctx, "production")
		require.NoError(t, err)
		assert.False(t, resp.ProjectUnavailable)
		assert.True(t, byScopeName(resp.Workflows)["global/release"].Hidden)
	})

	t.Run("outside it the project's are unavailable and hide nothing", func(t *testing.T) {
		resp, err := w.ListSharedWorkflows(ctx, "dev")
		require.NoError(t, err)
		assert.True(t, resp.ProjectUnavailable)
		assert.False(t, byScopeName(resp.Workflows)["global/release"].Hidden)
	})

	t.Run("a ref found in the environment's namespace is the project's only if that is the project's namespace", func(t *testing.T) {
		_, scope, err := w.sharedWorkflow(ctx, "production", "hotfix")
		require.NoError(t, err)
		assert.Equal(t, "project", scope)
		_, scope, err = w.sharedWorkflow(ctx, "dev", "release")
		require.NoError(t, err)
		assert.Equal(t, "global", scope)
	})
}
