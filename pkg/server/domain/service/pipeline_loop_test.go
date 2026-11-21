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
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"
	"github.com/kubevela/workflow/api/v1alpha1"

	"github.com/kubevela/velaux/pkg/server/domain/model"
)

func TestPipelineRunLoops(t *testing.T) {
	run := v1alpha1.WorkflowRun{
		ObjectMeta: metav1.ObjectMeta{Name: "release-1", Namespace: "team"},
		Spec:       v1alpha1.WorkflowRunSpec{WorkflowSpec: &wfTypesv1alpha1.WorkflowSpec{Steps: []wfTypesv1alpha1.WorkflowStep{rollout}}},
		Status: v1alpha1.WorkflowRunStatus{
			ContextBackend: &corev1.ObjectReference{Namespace: "team", Name: "workflow-release-1-context"},
			Steps: []v1alpha1.WorkflowStepStatus{{
				StepStatus: v1alpha1.StepStatus{ID: "rollout-id", Name: "rollout", Type: "step-group", Phase: v1alpha1.WorkflowStepPhaseRunning},
				SubStepsStatus: []v1alpha1.StepStatus{
					{ID: "a", Name: "rollout-0-deploy", Type: "deploy", Phase: v1alpha1.WorkflowStepPhaseRunning},
				},
			}},
		},
	}
	contextValue := map[string]string{"rollout-id.for-each-items": `[{"name":"east"},{"name":"west"}]`}

	pipelineRun, err := workflowRun2PipelineRun(run, &model.Project{Name: "team"}, nil, contextValue)
	require.NoError(t, err)

	assert.Equal(t, []string{"rollout-0-deploy"}, subStepNames(pipelineRun.Status.Steps[0]),
		"a loop's sub-steps are its passes, not its body")
	require.Contains(t, pipelineRun.Loops, "rollout")
	loop := pipelineRun.Loops["rollout"]
	assert.Equal(t, v1alpha1.WorkflowModeStep, loop.Mode)
	assert.Len(t, loop.Items, 2)
	assert.Equal(t, map[string]int{"rollout-0-deploy": 0}, loop.Iterations)
}

func subStepNames(s v1alpha1.WorkflowStepStatus) []string {
	var names []string
	for _, sub := range s.SubStepsStatus {
		names = append(names, sub.Name)
	}
	return names
}
