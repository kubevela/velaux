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
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"
	workflowv1alpha1 "github.com/kubevela/workflow/api/v1alpha1"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
)

func intp(i int) *int { return &i }

// loopApp is an Application whose workflow loops over east and west: rollout, a
// group of deploy then approve, has finished east and is waiting on west's
// approval.
func loopApp(workflow *v1beta1.Workflow) *v1beta1.Application {
	step := func(name, typ string, phase workflowv1alpha1.WorkflowStepPhase) workflowv1alpha1.StepStatus {
		return workflowv1alpha1.StepStatus{ID: name + "-id", Name: name, Type: typ, Phase: phase}
	}
	return &v1beta1.Application{
		ObjectMeta: metav1.ObjectMeta{Name: "shop", Namespace: "prod", Annotations: map[string]string{
			oam.AnnotationPublishVersion: "v1", oam.AnnotationDeployVersion: "r1",
		}},
		Spec: v1beta1.ApplicationSpec{Workflow: workflow},
		Status: common.AppStatus{Workflow: &common.WorkflowStatus{
			Phase:          workflowv1alpha1.WorkflowStateSuspending,
			ContextBackend: &corev1.ObjectReference{Namespace: "prod", Name: "workflow-shop-context"},
			Steps: []workflowv1alpha1.WorkflowStepStatus{{
				StepStatus: step("rollout", "step-group", workflowv1alpha1.WorkflowStepPhaseSuspending),
				SubStepsStatus: []workflowv1alpha1.StepStatus{
					step("rollout-0-deploy", "deploy", workflowv1alpha1.WorkflowStepPhaseSucceeded),
					step("rollout-0-approve", "suspend", workflowv1alpha1.WorkflowStepPhaseSucceeded),
					step("rollout-1-deploy", "deploy", workflowv1alpha1.WorkflowStepPhaseSucceeded),
					step("rollout-1-approve", "suspend", workflowv1alpha1.WorkflowStepPhaseSuspending),
				},
			}},
		}},
	}
}

var rollout = wfTypesv1alpha1.WorkflowStep{
	WorkflowStepBase: wfTypesv1alpha1.WorkflowStepBase{Name: "rollout", Type: "step-group"},
	SubSteps: []wfTypesv1alpha1.WorkflowStepBase{
		{Name: "deploy", Type: "deploy", Meta: &wfTypesv1alpha1.WorkflowStepMeta{Alias: "Deploy to region"}},
		{Name: "approve", Type: "suspend"},
	},
	ForEach: &wfTypesv1alpha1.ForEach{Items: &apiextensionsv1.JSON{Raw: []byte(`[{"name":"east"},{"name":"west"}]`)}},
}

var indexContext = map[string]string{"rollout-id.for-each-items": `[{"name":"east"},{"name":"west"}]`}

func syncLoopRecord(t *testing.T, app *v1beta1.Application, contextData map[string]string, objs ...client.Object) model.WorkflowStepStatus {
	t.Helper()
	ctx := context.Background()
	contextCM := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Namespace: "prod", Name: "workflow-shop-context"},
		Data:       contextData,
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(append(objs, app, contextCM)...).Build()
	ds, err := kubeapi.New(ctx, datastore.Config{Database: "velaux"}, cli)
	require.NoError(t, err)
	w := &workflowServiceImpl{Store: ds, KubeClient: cli}

	workflow := &model.Workflow{Name: "default", Steps: []model.WorkflowStep{{
		WorkflowStepBase: model.WorkflowStepBase{Name: "rollout", Type: "step-group"},
		SubSteps: []model.WorkflowStepBase{
			{Name: "deploy", Type: "deploy", Alias: "Deploy to region"},
			{Name: "approve", Type: "suspend"},
		},
		ForEach: rollout.ForEach,
	}}}
	record, err := w.CreateWorkflowRecord(ctx, &model.Application{Name: "shop"}, app, workflow)
	require.NoError(t, err)
	assert.Empty(t, record.Steps[0].SubStepsStatus, "a loop's passes are not known until it runs")
	assert.NotNil(t, record.Steps[0].Loop)

	revision := &model.ApplicationRevision{AppPrimaryKey: "shop", Version: "r1"}
	require.NoError(t, ds.Add(ctx, revision))
	require.NoError(t, w.syncRecordFromApplicationStatus(ctx, app, record, revision, nil))
	return record.Steps[0]
}

func TestLoopRecord(t *testing.T) {
	want := []model.StepStatus{
		{ID: "rollout-0-deploy-id", Name: "rollout-0-deploy", Alias: "Deploy to region", Type: "deploy", Phase: workflowv1alpha1.WorkflowStepPhaseSucceeded, Iteration: intp(0)},
		{ID: "rollout-0-approve-id", Name: "rollout-0-approve", Alias: "approve", Type: "suspend", Phase: workflowv1alpha1.WorkflowStepPhaseSucceeded, Iteration: intp(0)},
		{ID: "rollout-1-deploy-id", Name: "rollout-1-deploy", Alias: "Deploy to region", Type: "deploy", Phase: workflowv1alpha1.WorkflowStepPhaseSucceeded, Iteration: intp(1)},
		{ID: "rollout-1-approve-id", Name: "rollout-1-approve", Alias: "approve", Type: "suspend", Phase: workflowv1alpha1.WorkflowStepPhaseSuspending, Iteration: intp(1)},
	}
	check := func(t *testing.T, got model.WorkflowStepStatus) {
		assert.Equal(t, want, got.SubStepsStatus)
		require.NotNil(t, got.Loop)
		assert.Equal(t, workflowv1alpha1.WorkflowModeStep, got.Loop.Mode)
		assert.Equal(t, []interface{}{map[string]interface{}{"name": "east"}, map[string]interface{}{"name": "west"}}, got.Loop.Items)
	}

	t.Run("a loop in the Application's own steps", func(t *testing.T) {
		check(t, syncLoopRecord(t, loopApp(&v1beta1.Workflow{Steps: []wfTypesv1alpha1.WorkflowStep{rollout}}), indexContext))
	})

	t.Run("a loop in the Workflow the Application references", func(t *testing.T) {
		shared := &wfTypesv1alpha1.Workflow{
			ObjectMeta: metav1.ObjectMeta{Namespace: "prod", Name: "release"},
			Steps:      []wfTypesv1alpha1.WorkflowStep{rollout},
		}
		check(t, syncLoopRecord(t, loopApp(&v1beta1.Workflow{Ref: "release"}), indexContext, shared))
	})
}

func TestKeyedLoopRecord(t *testing.T) {
	keyed := rollout
	keyed.ForEach = &wfTypesv1alpha1.ForEach{Items: rollout.ForEach.Items, Key: []string{"name"}}
	app := loopApp(&v1beta1.Workflow{Steps: []wfTypesv1alpha1.WorkflowStep{keyed}})
	// The engine names a keyed loop's passes by key: rollout-east-deploy, not rollout-0-deploy.
	for i := range app.Status.Workflow.Steps[0].SubStepsStatus {
		s := &app.Status.Workflow.Steps[0].SubStepsStatus[i]
		s.Name = strings.NewReplacer("rollout-0-", "rollout-east-", "rollout-1-", "rollout-west-").Replace(s.Name)
	}
	got := syncLoopRecord(t, app, map[string]string{
		"rollout-id.for-each-items": `[{"name":"east"},{"name":"west"}]`,
		"rollout-id.for-each-keys":  `["east","west"]`,
	})

	var passes [][2]interface{}
	for _, p := range got.SubStepsStatus {
		require.NotNil(t, p.Iteration, p.Name)
		passes = append(passes, [2]interface{}{p.Name, *p.Iteration})
	}
	assert.Equal(t, [][2]interface{}{
		{"rollout-east-deploy", 0}, {"rollout-east-approve", 0}, {"rollout-west-deploy", 1}, {"rollout-west-approve", 1},
	}, passes)
	assert.Equal(t, "Deploy to region", got.SubStepsStatus[0].Alias)
	require.NotNil(t, got.Loop)
	assert.Equal(t, []string{"east", "west"}, got.Loop.Labels)
}
