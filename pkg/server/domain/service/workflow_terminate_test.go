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

	workflowv1alpha1 "github.com/kubevela/workflow/api/v1alpha1"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
)

// terminateFixture is application storefront deployed to environment prod
// (namespace shop), its workflow in the state given.
func terminateFixture(t *testing.T, wf *common.WorkflowStatus) (*workflowServiceImpl, *model.Application, *model.Workflow, client.Client) {
	t.Helper()
	ctx := context.Background()
	cr := &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{Name: "storefront", Namespace: "shop"}}
	cr.Status.Workflow = wf
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(cr).WithStatusSubresource(cr).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	app := &model.Application{Name: "storefront", Project: "shop"}
	workflow := &model.Workflow{AppPrimaryKey: "storefront", Name: "workflow-prod", EnvName: "prod"}
	for _, e := range []datastore.Entity{
		&model.Project{Name: "shop"},
		&model.Env{Name: "prod", Project: "shop", Namespace: "shop"},
		app,
		&model.EnvBinding{AppPrimaryKey: "storefront", Name: "prod"},
		workflow,
	} {
		require.NoError(t, store.Add(ctx, e))
	}
	envService := &envServiceImpl{Store: store, KubeClient: cli}
	return &workflowServiceImpl{
		Store:             store,
		KubeClient:        cli,
		EnvService:        envService,
		EnvBindingService: &envBindingServiceImpl{Store: store, EnvService: envService, KubeClient: cli},
	}, app, workflow, cli
}

// executing is a workflow stuck in a running step, as a dependsOn cycle
// leaves it: not suspended, not terminated, not finished.
func executing() *common.WorkflowStatus {
	return &common.WorkflowStatus{Steps: []workflowv1alpha1.WorkflowStepStatus{{
		StepStatus: workflowv1alpha1.StepStatus{Name: "deploy", Phase: workflowv1alpha1.WorkflowStepPhaseRunning},
	}}}
}

func deployed(t *testing.T, cli client.Client) *v1beta1.Application {
	t.Helper()
	cr := &v1beta1.Application{}
	require.NoError(t, cli.Get(context.Background(), types.NamespacedName{Name: "storefront", Namespace: "shop"}, cr))
	return cr
}

func TestTerminateAnExecutingWorkflow(t *testing.T) {
	ctx := context.Background()

	t.Run("a workflow stuck executing is terminated", func(t *testing.T) {
		w, app, workflow, cli := terminateFixture(t, executing())
		require.NoError(t, w.TerminateWorkflow(ctx, app, workflow))
		cr := deployed(t, cli)
		assert.True(t, cr.Status.Workflow.Terminated)
		assert.Equal(t, workflowv1alpha1.WorkflowStepPhaseFailed, cr.Status.Workflow.Steps[0].Phase)
	})

	t.Run("one waiting for approval is terminated, as before", func(t *testing.T) {
		wf := executing()
		wf.Suspend = true
		w, app, workflow, cli := terminateFixture(t, wf)
		require.NoError(t, w.TerminateWorkflow(ctx, app, workflow))
		assert.True(t, deployed(t, cli).Status.Workflow.Terminated)
	})

	t.Run("a finished workflow is refused: there is nothing to end", func(t *testing.T) {
		wf := executing()
		wf.Finished = true
		w, app, workflow, _ := terminateFixture(t, wf)
		assert.Error(t, w.TerminateWorkflow(ctx, app, workflow))
	})

	t.Run("an application with no workflow run is refused, not a panic", func(t *testing.T) {
		w, app, workflow, _ := terminateFixture(t, nil)
		assert.Error(t, w.TerminateWorkflow(ctx, app, workflow))
	})

	t.Run("resuming an executing workflow is still refused", func(t *testing.T) {
		w, app, workflow, _ := terminateFixture(t, executing())
		assert.Error(t, w.ResumeWorkflow(ctx, app, workflow, ""))
	})
}
