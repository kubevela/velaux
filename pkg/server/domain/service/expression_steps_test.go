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
	"encoding/json"
	"testing"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// stepsService is an application with a source, cfg, whose regions are a list
// of objects with a string name and an int zone.
func stepsService(t *testing.T) (*expressionServiceImpl, *model.Application) {
	t.Helper()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).
		WithObjects(sourceDefinition("regions", velaNS, "regions: [...{name: string, zone: int}]")).Build()
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"},
		Sources: []v1beta1.ApplicationSource{{Name: "cfg", Type: "regions"}}}
	return &expressionServiceImpl{enabled: true, KubeClient: cli}, app
}

// workflowSteps are a workflow's steps: names declares an output, deploy is the
// step being edited and declares its own, and notify declares none.
var workflowSteps = []apisv1.ExpressionStepOutputs{
	{Name: "names", Outputs: []string{"list"}},
	{Name: "deploy", Outputs: []string{"done"}},
	{Name: "notify"},
}

func loopStep(items string) apisv1.ExpressionStep {
	return apisv1.ExpressionStep{Step: "deploy", LoopBody: true, ForEachItems: json.RawMessage(items), Steps: workflowSteps}
}

// A workflow step reads the other steps' declared outputs, and a loop body each
// with the fields its items have.
func TestExpressionEnvStepRoots(t *testing.T) {
	svc, app := stepsService(t)
	env, err := svc.Env(context.Background(), app, "workflowstep", "", "", loopStep(`[{"name":"eu","port":80}]`))
	require.NoError(t, err)

	steps := root(env, "steps")
	require.NotNil(t, steps)
	var names []string
	for _, c := range steps.Children {
		names = append(names, c.Name)
	}
	assert.Equal(t, []string{"names"}, names, "the step itself and a step declaring no output are left out")
	assert.Equal(t, "dyn", child(steps, "names", "outputs", "list").Type, "an output declares no type")

	each := root(env, "each")
	require.NotNil(t, each)
	assert.Equal(t, "string", child(each, "item", "name").Type, "a literal item's fields are typed as written")
	assert.Equal(t, "int", child(each, "item", "port").Type)
	assert.Equal(t, "int", child(each, "index").Type)

	env, err = svc.Env(context.Background(), app, "workflowstep", "", "", loopStep(`"$(source.cfg.regions)"`))
	require.NoError(t, err)
	assert.Equal(t, "int", child(root(env, "each"), "item", "zone").Type, "items read from a source take its schema")

	env, err = svc.Env(context.Background(), app, "workflowstep", "", "", apisv1.ExpressionStep{Step: "deploy", Steps: workflowSteps})
	require.NoError(t, err)
	assert.NotNil(t, root(env, "steps"))
	assert.Nil(t, root(env, "each"), "a step outside a loop has no each")

	env, err = svc.Env(context.Background(), app, "component", "", "", loopStep(`[1]`))
	require.NoError(t, err)
	assert.Nil(t, root(env, "steps"), "only a workflow step reads steps")
	assert.Nil(t, root(env, "each"))
}

// each is typed from the loop's items as admission types it, and steps and each
// are refused where admission refuses them.
func TestExpressionCheckStepReads(t *testing.T) {
	svc, app := stepsService(t)
	check := func(surface, value, kind string, step apisv1.ExpressionStep) (string, []string) {
		t.Helper()
		got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: surface, Value: value, Kind: kind, ExpressionStep: step})
		require.NoError(t, err)
		var errs []string
		for _, i := range got.Issues {
			if !i.Warning {
				errs = append(errs, i.Message)
			}
		}
		return got.Type, errs
	}
	literal := loopStep(`[{"name":"eu","port":80},{"name":"us","port":81}]`)

	typ, errs := check("workflowstep", "$(each.item.port)", "string", literal)
	assert.Equal(t, "int", typ, "a literal item is typed as written")
	assert.Equal(t, []string{"this value is int, but the parameter expects string"}, errs)

	typ, errs = check("workflowstep", "$(each.item.name)", "string", literal)
	assert.Equal(t, "string", typ)
	assert.Empty(t, errs)

	typ, errs = check("workflowstep", "$(each.index)", "integer", literal)
	assert.Equal(t, "int", typ, "each.index is an int")
	assert.Empty(t, errs)

	typ, errs = check("workflowstep", "$(each.item.zone)", "string", loopStep(`"$(source.cfg.regions)"`))
	assert.Equal(t, "int", typ, "items read from a source are typed by its schema")
	assert.Equal(t, []string{"this value is int, but the parameter expects string"}, errs)

	typ, errs = check("workflowstep", "$(each.item)", "string", loopStep(`"$(steps.names.outputs.list)"`))
	assert.Equal(t, "dyn", typ, "items from a step's output declare no type")
	assert.Empty(t, errs)

	_, errs = check("workflowstep", "$(each.item)", "", apisv1.ExpressionStep{Step: "deploy"})
	assert.Equal(t, []string{"each is only set inside a forEach body"}, errs)

	_, errs = check("component", "$(each.index)", "", literal)
	require.Len(t, errs, 1)
	assert.Contains(t, errs[0], `"each" cannot be read here`)

	_, errs = check("trait", "$(steps.names.outputs.list)", "", literal)
	require.Len(t, errs, 1)
	assert.Contains(t, errs[0], `"steps" cannot be read here`)

	_, errs = check("workflowstep", "$(steps.names.outputs.list)", "", literal)
	assert.Empty(t, errs, "a declared output of another step is read")

	_, errs = check("workflowstep", "$(steps.names.outputs.nope)", "", literal)
	assert.Equal(t, []string{`step names declares no output "nope"`}, errs)

	_, errs = check("workflowstep", "$(steps.gone.outputs.list)", "", literal)
	assert.Equal(t, []string{`no step "gone"`}, errs)

	_, errs = check("workflowstep", "$(steps.names)", "", literal)
	assert.Equal(t, []string{"read steps.names.outputs.<name>"}, errs)

	_, errs = check("workflowstep", "$(steps.deploy.outputs.done)", "", literal)
	assert.Equal(t, []string{"step deploy cannot read its own outputs"}, errs)

	_, errs = check("workflowstep", "$(steps.gone.outputs.list)", "", apisv1.ExpressionStep{})
	assert.Empty(t, errs, "without the workflow's steps, a step read is not judged")

	_, errs = check("workflowstep", "$(component.db.output)", "", literal)
	assert.Equal(t, []string{"only component and trait properties can read component.<name>"}, errs)
}
