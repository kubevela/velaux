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
	assert.Equal(t, []string{"names", "notify"}, names, "the step itself is left out")
	assert.Equal(t, "dyn", child(steps, "names", "outputs", "list").Type, "an output declares no type")
	assert.Nil(t, child(steps, "notify", "outputs"), "a step declaring no output offers none")
	assert.Equal(t, "string", child(steps, "notify", "phase").Type, "every step offers its status once finished")
	assert.Equal(t, "bool", child(steps, "notify", "succeeded").Type)
	assert.Equal(t, "bool", child(steps, "names", "failedAfterRetries").Type)

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
	assert.Equal(t, []string{"read steps.names.outputs.<name>, or steps.names.<phase|message|reason|succeeded|failed|skipped|timeout|failedAfterRetries|terminate>"}, errs)

	_, errs = check("workflowstep", "$(steps.names.phase)", "", literal)
	assert.Empty(t, errs, "a step's status is read in properties too")

	_, errs = check("workflowstep", "$(steps.gone.succeeded)", "", literal)
	assert.Equal(t, []string{`no step "gone"`}, errs)

	_, errs = check("workflowstep", "$(steps.deploy.outputs.done)", "", literal)
	assert.Equal(t, []string{"step deploy cannot read its own outputs"}, errs)

	_, errs = check("workflowstep", "$(steps.deploy.failed)", "", literal)
	assert.Equal(t, []string{"step deploy cannot read its own outputs"}, errs, "nor its own status, as the workflow refuses")

	_, errs = check("workflowstep", "$(steps.gone.outputs.list)", "", apisv1.ExpressionStep{})
	assert.Empty(t, errs, "without the workflow's steps, a step read is not judged")

	_, errs = check("workflowstep", "$(component.db.output)", "", literal)
	assert.Equal(t, []string{`"component" cannot be read here; this surface permits "context", "source", "steps", "each"`}, errs)
}

// A step's if that is one $( ) expression is checked as admission checks it: a
// required bool, in admission's words. Any other if is CUE, and is not read.
func TestExpressionCheckConditions(t *testing.T) {
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).
		WithObjects(sourceDefinition("flags", velaNS, "name: string, on: bool, maybe?: bool")).Build()
	svc := &expressionServiceImpl{enabled: true, KubeClient: cli}
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"},
		Sources: []v1beta1.ApplicationSource{{Name: "f", Type: "flags"}}}
	condition := func(value string, step apisv1.ExpressionStep) (string, []string) {
		t.Helper()
		step.Condition = true
		got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "workflowstep", Value: value, ExpressionStep: step})
		require.NoError(t, err)
		var errs []string
		for _, i := range got.Issues {
			if !i.Warning {
				errs = append(errs, i.Message)
			}
		}
		return got.Type, errs
	}
	top := apisv1.ExpressionStep{Step: "deploy", Steps: workflowSteps}

	_, errs := condition("$(source.f.name)", top)
	assert.Equal(t, []string{"type mismatch: expression $(source.f.name) is string but if expects bool"}, errs)

	typ, errs := condition(`$(source.f.name == "eu")`, top)
	assert.Equal(t, "bool", typ, "a comparison is a bool")
	assert.Empty(t, errs)

	_, errs = condition("$(source.f.on)", top)
	assert.Empty(t, errs)

	_, errs = condition("$(source.f.maybe)", top)
	assert.Equal(t, []string{"source.f.maybe may be absent and decides the step; guard it with has(source.f.maybe) ? source.f.maybe : <fallback>"}, errs)

	_, errs = condition("$(has(source.f.maybe) ? source.f.maybe : false)", top)
	assert.Empty(t, errs, "a guarded read may be absent")

	_, errs = condition("$(each.index == 0)", top)
	assert.Equal(t, []string{"each is only set inside a forEach body"}, errs,
		"a top-level step's own if is decided once, before its loop, so it has no each")

	inGroup := []apisv1.ExpressionStepOutputs{{Name: "names", Outputs: []string{"list"}}, {Name: "notify"},
		{Name: "rollout", ForEach: true, SubSteps: []apisv1.ExpressionStepOutputs{{Name: "deploy", Outputs: []string{"done"}}}}}
	sub := apisv1.ExpressionStep{Step: "deploy", Steps: inGroup, LoopBody: true,
		ForEachItems: json.RawMessage(`[{"name":"eu","enabled":true}]`)}
	typ, errs = condition("$(each.item.enabled)", sub)
	assert.Equal(t, "bool", typ, "a looping group's sub-step decides its if per pass, so it reads each")
	assert.Empty(t, errs)

	_, errs = condition("$(each.item.name)", sub)
	assert.Equal(t, []string{"type mismatch: expression $(each.item.name) is string but if expects bool"}, errs)

	_, errs = condition(`$(steps.names.succeeded && steps.names.phase == "succeeded")`, top)
	assert.Empty(t, errs, "a condition reads other steps' status")

	_, errs = condition("$(steps.names.bogus)", top)
	assert.Equal(t, []string{"read steps.names.outputs.<name>, or steps.names.<phase|message|reason|succeeded|failed|skipped|timeout|failedAfterRetries|terminate>"}, errs)

	for _, cue := range []string{"always", "", "status.names.succeeded", `context.name == "$(x)"`, "$(a) && $(b)"} {
		got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "workflowstep", Value: cue,
			ExpressionStep: apisv1.ExpressionStep{Condition: true}})
		require.NoError(t, err)
		assert.Empty(t, got.Issues, "%q is CUE, which the check does not read", cue)
		assert.Empty(t, got.Type, "%q", cue)
	}
}

// With the workflow's steps, a step's reads are judged by the workflow's own
// validation: in order, a step cannot wait for a later one, and in parallel it
// can; a group's step reads its group's outputs per pass.
func TestExpressionCheckStepOrder(t *testing.T) {
	svc, app := stepsService(t)
	steps := []apisv1.ExpressionStepOutputs{{Name: "first"}, {Name: "second", Outputs: []string{"out"}}}
	check := func(scope apisv1.ExpressionStep) []string {
		t.Helper()
		got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "workflowstep",
			Value: "$(steps.second.outputs.out)", ExpressionStep: scope})
		require.NoError(t, err)
		var errs []string
		for _, i := range got.Issues {
			if !i.Warning {
				errs = append(errs, i.Message)
			}
		}
		return errs
	}
	assert.Equal(t, []string{"second runs after first, and a workflow run in order cannot wait for it"},
		check(apisv1.ExpressionStep{Step: "first", Steps: steps}))
	assert.Empty(t, check(apisv1.ExpressionStep{Step: "first", Steps: steps, Mode: "DAG"}), "in parallel, the read is a dependsOn")
	assert.Equal(t, []string{"step second cannot read its own outputs"}, check(apisv1.ExpressionStep{Step: "second", Steps: steps}))
}
