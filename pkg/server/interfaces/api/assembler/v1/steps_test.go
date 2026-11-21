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

package v1

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"

	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

func TestWorkflowStepForEachRoundTrip(t *testing.T) {
	forEach := &wfTypesv1alpha1.ForEach{
		Items: &apiextensionsv1.JSON{Raw: []byte(`["east","west"]`)},
		Key:   []string{"name"},
		Mode:  "DAG",
	}
	steps, err := CreateWorkflowStepModel([]apisv1.WorkflowStep{{
		WorkflowStepBase: apisv1.WorkflowStepBase{Name: "deploy", Type: "deploy"},
		ForEach:          forEach,
	}})
	require.NoError(t, err)
	assert.Equal(t, forEach, steps[0].ForEach)
	assert.Equal(t, forEach, ConvertFromWorkflowStepModel(steps[0]).ForEach)
}
