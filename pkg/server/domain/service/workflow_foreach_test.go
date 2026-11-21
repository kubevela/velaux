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
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"

	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"

	"github.com/kubevela/velaux/pkg/server/domain/model"
)

func TestDeployedStepsKeepForEach(t *testing.T) {
	forEach := &wfTypesv1alpha1.ForEach{Items: &apiextensionsv1.JSON{Raw: []byte(`["east","west"]`)}, Key: []string{"name"}}
	step := model.WorkflowStep{
		WorkflowStepBase: model.WorkflowStepBase{Name: "deploy", Type: "deploy", Properties: &model.JSONStruct{}},
		ForEach:          forEach,
	}
	t.Run("to an Application", func(t *testing.T) {
		assert.Equal(t, forEach, workflowStepSpecs([]model.WorkflowStep{step})[0].ForEach)
	})
	t.Run("to a WorkflowRun", func(t *testing.T) {
		assert.Equal(t, forEach, pipelineStep2WorkflowStep(step).ForEach)
	})
}
