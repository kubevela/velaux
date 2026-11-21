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

package convert

import (
	"testing"

	"github.com/stretchr/testify/assert"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"

	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"
)

func TestFromCRWorkflowStepsAlias(t *testing.T) {
	steps, err := FromCRWorkflowSteps([]wfTypesv1alpha1.WorkflowStep{{
		WorkflowStepBase: wfTypesv1alpha1.WorkflowStepBase{
			Name: "checks",
			Type: "step-group",
			Meta: &wfTypesv1alpha1.WorkflowStepMeta{Alias: "Standard checks"},
		},
		SubSteps: []wfTypesv1alpha1.WorkflowStepBase{{
			Name: "health",
			Type: "suspend",
			Meta: &wfTypesv1alpha1.WorkflowStepMeta{Alias: "Health check"},
		}},
	}})
	assert.NoError(t, err)
	assert.Equal(t, "Standard checks", steps[0].Alias)
	assert.Equal(t, "Health check", steps[0].SubSteps[0].Alias)
}

func TestFromCRWorkflowStepsForEach(t *testing.T) {
	forEach := &wfTypesv1alpha1.ForEach{
		Items: &apiextensionsv1.JSON{Raw: []byte(`[{"name":"east"},{"name":"west"}]`)},
		Key:   []string{"name"},
		Mode:  "StepByStep",
	}
	steps, err := FromCRWorkflowSteps([]wfTypesv1alpha1.WorkflowStep{
		{WorkflowStepBase: wfTypesv1alpha1.WorkflowStepBase{Name: "deploy", Type: "deploy"}, ForEach: forEach},
		{WorkflowStepBase: wfTypesv1alpha1.WorkflowStepBase{Name: "rollout", Type: "step-group"}, ForEach: &wfTypesv1alpha1.ForEach{From: "regions"}},
	})
	assert.NoError(t, err)
	assert.Equal(t, forEach, steps[0].ForEach)
	assert.Equal(t, "regions", steps[1].ForEach.From)
}
