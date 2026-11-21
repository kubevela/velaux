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
	v1 "k8s.io/api/core/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// workflowCheckService knows step type notify, whose count is an integer and
// message a string.
func workflowCheckService() *expressionServiceImpl {
	def := &v1beta1.WorkflowStepDefinition{ObjectMeta: metav1.ObjectMeta{Name: "notify", Namespace: types.DefaultKubeVelaNS}}
	cm := &v1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "workflowstep-schema-notify", Namespace: types.DefaultKubeVelaNS},
		Data: map[string]string{types.OpenapiV3JSONSchema: `{"type":"object","properties":{
			"count":{"type":"integer"},
			"message":{"type":"string"}}}`},
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(def, cm).Build()
	return &expressionServiceImpl{enabled: true, KubeClient: cli, DefinitionService: &definitionServiceImpl{KubeClient: cli}}
}

func notify(name string, properties apisv1.Properties) apisv1.WorkflowStepBase {
	return apisv1.WorkflowStepBase{Name: name, Type: "notify", Properties: properties}
}

func listOf(raw string) *wfTypesv1alpha1.ForEach {
	return &wfTypesv1alpha1.ForEach{Items: &apiextensionsv1.JSON{Raw: []byte(raw)}}
}

func TestCheckWorkflowRefusesWhatTheStudioFlags(t *testing.T) {
	ctx := context.Background()
	svc := workflowCheckService()
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"}}

	t.Run("a step property of the wrong type", func(t *testing.T) {
		err := svc.CheckWorkflow(ctx, app, []apisv1.WorkflowStep{
			{WorkflowStepBase: notify("announce", apisv1.Properties{"count": "$(context.appName)"})},
		}, "", "")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "steps.announce.properties.count")
	})

	t.Run("an if that is a whole $( ) expression but not a bool", func(t *testing.T) {
		step := notify("announce", apisv1.Properties{"message": "hi"})
		step.If = "$(context.appName)"
		err := svc.CheckWorkflow(ctx, app, []apisv1.WorkflowStep{{WorkflowStepBase: step}}, "", "")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "steps.announce.if")
	})

	t.Run("loop items reading a step the workflow does not have", func(t *testing.T) {
		err := svc.CheckWorkflow(ctx, app, []apisv1.WorkflowStep{
			{WorkflowStepBase: notify("announce", apisv1.Properties{"message": "hi"}), ForEach: listOf(`"$(steps.nosuch.outputs.list)"`)},
		}, "", "")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "steps.announce.forEach.items")
	})

	t.Run("a sub-step in a group is checked too", func(t *testing.T) {
		err := svc.CheckWorkflow(ctx, app, []apisv1.WorkflowStep{
			{WorkflowStepBase: apisv1.WorkflowStepBase{Name: "group", Type: "step-group"},
				SubSteps: []apisv1.WorkflowStepBase{notify("inner", apisv1.Properties{"count": "$(context.appName)"})}},
		}, "", "")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "steps.inner.properties.count")
	})

	t.Run("a workflow whose expressions are sound is accepted", func(t *testing.T) {
		step := notify("announce", apisv1.Properties{"message": "$(context.appName)", "count": 2})
		step.If = "status.announce.timeout"
		assert.NoError(t, svc.CheckWorkflow(ctx, app, []apisv1.WorkflowStep{{WorkflowStepBase: step}}, "", ""))
	})
}

func TestCheckWorkflowOnlyWhereExpressionsAreRead(t *testing.T) {
	ctx := context.Background()
	broken := []apisv1.WorkflowStep{{WorkflowStepBase: notify("announce", apisv1.Properties{"count": "$(context.appName)"})}}

	plain := &model.Application{Name: "shop"}
	assert.NoError(t, workflowCheckService().CheckWorkflow(ctx, plain, broken, "", ""), "an application not opted in reads $( literally")

	off := workflowCheckService()
	off.enabled = false
	optedIn := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"}}
	assert.NoError(t, off.CheckWorkflow(ctx, optedIn, broken, "", ""), "nor where expressions are off")
}
