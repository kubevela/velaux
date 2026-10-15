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
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"github.com/google/cel-go/cel"
	celengine "github.com/kubevela/pkg/cel"
	"github.com/kubevela/pkg/cel/template"

	"github.com/oam-dev/kubevela/pkg/definition/celexpr"
	"github.com/oam-dev/kubevela/pkg/definition/propexpr"
	"github.com/oam-dev/kubevela/pkg/schema"
	"github.com/oam-dev/kubevela/pkg/sources"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// stepIssues reports the steps and each reads in an expression that admission
// would refuse: either root off a workflow step, each outside a loop body, and,
// when the request lists the workflow's steps, a read of a step or output the
// workflow does not declare. The messages are the workflow's own.
func stepIssues(req apisv1.ExpressionCheckRequest, expr string, start int) []*apisv1.ExpressionIssue {
	refs, err := celexpr.PropertyReferences(expr)
	if err != nil {
		return nil
	}
	permitted := sources.RootsFor(req.Surface)
	var out []*apisv1.ExpressionIssue
	issue := func(msg string) {
		out = append(out, &apisv1.ExpressionIssue{Message: msg, Start: start, End: start + len(expr)})
	}
	for _, r := range refs {
		if r.Root != propexpr.StepsIdent && r.Root != propexpr.EachIdent {
			continue
		}
		if !slices.Contains(permitted, r.Root) {
			issue(rootRefusal(r.Root, req.Surface))
			continue
		}
		switch r.Root {
		case propexpr.EachIdent:
			if !req.LoopBody {
				issue("each is only set inside a forEach body")
			}
		case propexpr.StepsIdent:
			if msg := stepReadIssue(req.ExpressionStep, r); msg != "" {
				issue(msg)
			}
		}
	}
	return out
}

// stepStatusFields are what steps.<name> offers beside outputs: the step's
// status once it has finished, as the workflow answers it, with their types.
var stepStatusFields = []struct{ name, kind, description string }{
	{"phase", kindString, "The step's phase once it has finished, such as succeeded or failed"},
	{"message", kindString, "The step's message"},
	{"reason", kindString, "Why the step ended in its phase"},
	{"succeeded", kindBool, "Whether the step succeeded"},
	{"failed", kindBool, "Whether the step failed"},
	{"skipped", kindBool, "Whether the step was skipped"},
	{"timeout", kindBool, "Whether the step timed out"},
	{"failedAfterRetries", kindBool, "Whether the step failed after its retries"},
	{"terminate", kindBool, "Whether the step terminated the workflow"},
}

func isStepStatusField(name string) bool {
	for _, f := range stepStatusFields {
		if f.name == name {
			return true
		}
	}
	return false
}

// stepReadHint is the refusal of a steps.<name> read that is neither an output
// nor a status field, in the workflow's words.
func stepReadHint(name string) string {
	fields := make([]string, len(stepStatusFields))
	for i, f := range stepStatusFields {
		fields[i] = f.name
	}
	return fmt.Sprintf("read steps.%s.outputs.<name>, or steps.%s.<%s>", name, name, strings.Join(fields, "|"))
}

// stepReadIssue is what is wrong with a steps.<name>.outputs.<output> or
// steps.<name>.<status field> read, or "" when nothing is or the request does
// not list the workflow's steps.
func stepReadIssue(step apisv1.ExpressionStep, r template.Reference) string {
	name := "<step>"
	if len(r.Path) > 0 {
		name = r.Path[0]
	}
	if len(r.Path) >= 2 && isStepStatusField(r.Path[1]) {
		switch {
		case step.Steps == nil:
			return ""
		case name == step.Step:
			return fmt.Sprintf("step %s cannot read its own outputs", name)
		case !declaresStep(step.Steps, name):
			return fmt.Sprintf("no step %q", name)
		}
		return ""
	}
	if len(r.Path) < 3 || r.Path[1] != "outputs" {
		return stepReadHint(name)
	}
	if step.Steps == nil {
		return ""
	}
	output := r.Path[2]
	if name == step.Step {
		return fmt.Sprintf("step %s cannot read its own outputs", name)
	}
	for _, s := range step.Steps {
		if s.Name != name {
			continue
		}
		if slices.Contains(s.Outputs, output) {
			return ""
		}
		return fmt.Sprintf("step %s declares no output %q", name, output)
	}
	return fmt.Sprintf("no step %q", name)
}

func declaresStep(steps []apisv1.ExpressionStepOutputs, name string) bool {
	for _, s := range steps {
		if s.Name == name {
			return true
		}
	}
	return false
}

// readKind is the kind admission gives a value that is exactly one component or
// each read: a component's from what it applies, the loop's from its items, an
// item read from a source typed by that source's schema.
func (e *expressionServiceImpl) readKind(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest,
	sourceSchemas map[string]string) (string, bool) {
	ref, ok := schema.BareRead(req.Value)
	if !ok || (ref.Root != propexpr.ComponentIdent && ref.Root != propexpr.EachIdent) {
		return "", false
	}
	kind, ok := e.refKind(ctx, app, req, propexpr.CompileSchemas(sourceSchemas), ref)
	if !ok {
		return "", false
	}
	return kindLabel(kind)
}

// refKind is the kind admission knows for one read: a component's from what it
// applies, the loop's from its items, and a source's or context's from its schema.
func (e *expressionServiceImpl) refKind(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest,
	compiled propexpr.Schemas, ref template.Reference) (cue.Kind, bool) {
	switch ref.Root {
	case propexpr.ComponentIdent:
		return e.componentReadKind(ctx, app, ref)
	case propexpr.EachIdent:
		return schema.EachReadKind(schema.LoopItemKind(req.ForEachItems, compiled.Kind), ref)
	}
	return compiled.Kind(ref)
}

// kindLabel is a CUE kind as the editor names it.
func kindLabel(kind cue.Kind) (string, bool) {
	switch kind {
	case cue.StringKind:
		return kindString, true
	case cue.IntKind:
		return kindInt, true
	case cue.NumberKind, cue.FloatKind:
		return kindNumber, true
	case cue.BoolKind:
		return kindBool, true
	case cue.ListKind:
		return kindList, true
	case cue.StructKind:
		return kindObject, true
	}
	return "", false
}

// stepRoots are the roots only a workflow step reads: steps, every other step
// the request lists with the outputs it declares and its status fields, and, in
// a loop body, each.
func stepRoots(step apisv1.ExpressionStep, sourceSchemas map[string]string) []*apisv1.ExpressionVariable {
	steps := &apisv1.ExpressionVariable{Name: propexpr.StepsIdent, Type: kindObject,
		Description: "The workflow's other steps, by name: an output one declares or, once it has finished, its status; the step then waits for it"}
	for _, s := range step.Steps {
		if s.Name == step.Step {
			continue
		}
		var children []*apisv1.ExpressionVariable
		if len(s.Outputs) > 0 {
			outputs := &apisv1.ExpressionVariable{Name: "outputs", Type: kindObject, Description: "The outputs the step declares"}
			for _, o := range s.Outputs {
				outputs.Children = append(outputs.Children, &apisv1.ExpressionVariable{Name: o, Type: kindDyn,
					Description: "Declared without a type: cast what you read, such as int(...) or string(...)"})
			}
			children = append(children, outputs)
		}
		for _, f := range stepStatusFields {
			children = append(children, &apisv1.ExpressionVariable{Name: f.name, Type: f.kind, Description: f.description})
		}
		steps.Children = append(steps.Children, &apisv1.ExpressionVariable{Name: s.Name, Type: kindObject, Children: children})
	}
	out := []*apisv1.ExpressionVariable{steps}
	if !step.LoopBody {
		return out
	}
	item := loopItemVariable(step.ForEachItems, sourceSchemas)
	item.Description = "The item this pass runs for"
	return append(out, &apisv1.ExpressionVariable{Name: propexpr.EachIdent, Type: kindObject,
		Description: "The loop's current pass",
		Children: []*apisv1.ExpressionVariable{item,
			{Name: "index", Type: kindInt, Description: "The item's position in the list, from 0"}}})
}

// loopItemVariable is each.item with the fields its items declare: a literal
// list's as written, one source read's from the source's schema, any type
// otherwise.
func loopItemVariable(items json.RawMessage, sourceSchemas map[string]string) *apisv1.ExpressionVariable {
	untyped := &apisv1.ExpressionVariable{Name: "item", Type: kindDyn}
	var literal interface{}
	if len(items) == 0 || json.Unmarshal(items, &literal) != nil {
		return untyped
	}
	switch v := literal.(type) {
	case []interface{}:
		s := schema.LiteralSchema(v)
		if s.Items == nil || s.Items.Value == nil {
			return untyped
		}
		return schemaVariable("item", s.Items.Value, 0)
	case string:
		ref, ok := schema.BareRead(v)
		if !ok || ref.Root != propexpr.SourceIdent || len(ref.Path) == 0 {
			return untyped
		}
		text, ok := sourceSchemas[ref.Path[0]]
		if !ok {
			return untyped
		}
		val := cuecontext.New().CompileString(text)
		for _, seg := range ref.Path[1:] {
			if i, err := strconv.Atoi(seg); err == nil {
				val = val.LookupPath(cue.MakePath(cue.Index(i)))
			} else {
				val = val.LookupPath(cue.MakePath(cue.Str(seg)))
			}
		}
		elem := val.LookupPath(cue.MakePath(cue.AnyIndex))
		if !elem.Exists() {
			return untyped
		}
		return variableOf("item", elem, 0)
	}
	return untyped
}

// conditionIssues types a step's $( ) if as admission does: a required bool,
// whose reads that may be absent must be guarded with has(), in admission's
// words.
func (e *expressionServiceImpl) conditionIssues(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest,
	env *cel.Env, sourceSchemas map[string]string) []*apisv1.ExpressionIssue {
	value := strings.TrimSpace(req.Value)
	return e.targetFaults(ctx, app, req, env, sourceSchemas, value, conditionBool,
		func(got string) string {
			return fmt.Sprintf("type mismatch: expression %v is %s but if expects bool", value, got)
		},
		func(read string) string {
			return fmt.Sprintf("%s may be absent and decides the step; %s", read, guardHint(read))
		})
}

// absentIssues refuses, as admission does, a read that may be absent feeding a
// required parameter unless has() guards it. The type it feeds is judged by
// targetIssue.
func (e *expressionServiceImpl) absentIssues(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest,
	env *cel.Env, sourceSchemas map[string]string) []*apisv1.ExpressionIssue {
	return e.targetFaults(ctx, app, req, env, sourceSchemas, req.Value, requiredAny, nil,
		func(read string) string {
			return fmt.Sprintf("%s may be absent and feeds a required parameter; %s", read, guardHint(read))
		})
}

// guardHint is admission's advice for a read that may be absent.
func guardHint(read string) string {
	return fmt.Sprintf("guard it with has(%s) ? %s : <fallback>", read, read)
}

// targetFaults types a whole value against target as admission's type pass
// does, with the kinds admission knows for reads and the has() rule for one that
// may be absent, worded by mismatch and absent. A nil mismatch reports none.
func (e *expressionServiceImpl) targetFaults(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest,
	env *cel.Env, sourceSchemas map[string]string, value string, target celengine.Target,
	mismatch func(got string) string, absent func(read string) string) []*apisv1.ExpressionIssue {
	raw, err := json.Marshal(value)
	if err != nil {
		return nil
	}
	plan, err := celexpr.Vela.PlanJSON(raw)
	if err != nil {
		return nil
	}
	compiled := propexpr.CompileSchemas(sourceSchemas)
	opts := celengine.TypeOptions{
		Optional: func(r celengine.Read) bool {
			may, err := compiled.CanBeAbsent(r.Reference)
			return err == nil && may
		},
		DeclaredKind: func(r celengine.Read) (cue.Kind, bool) {
			return e.refKind(ctx, app, req, compiled, r.Reference)
		},
	}
	var out []*apisv1.ExpressionIssue
	for _, f := range plan.CheckTypes(env, target, opts) {
		var m *celengine.TypeMismatch
		var a *celengine.MayBeAbsent
		msg := f.Err.Error()
		switch {
		case errors.As(f.Err, &m):
			if mismatch == nil {
				continue
			}
			msg = mismatch(m.Got)
		case errors.As(f.Err, &a):
			msg = absent(a.Read.String())
		}
		out = append(out, &apisv1.ExpressionIssue{Message: msg, Start: 0, End: len(req.Value)})
	}
	return out
}

// requiredAny is a required parameter of any type, the target the has() rule
// is judged against.
var requiredAny = func() celengine.Target {
	top := cuecontext.New().CompileString("_")
	return celengine.TargetFunc(func(property string) (cue.Value, bool, bool) {
		if property != "" {
			return cue.Value{}, false, false
		}
		return top, true, true
	})
}()

// conditionBool is a step's $( ) if as the engine's target: a required bool,
// since a condition that may be absent decides nothing.
var conditionBool = func() celengine.Target {
	b := cuecontext.New().CompileString("bool")
	return celengine.TargetFunc(func(property string) (cue.Value, bool, bool) {
		if property != "" {
			return cue.Value{}, false, false
		}
		return b, true, true
	})
}()

// rootRefusal is admission's refusal of a root the surface does not offer.
func rootRefusal(root, surface string) string {
	permitted := sources.RootsFor(surface)
	quoted := make([]string, len(permitted))
	for i, p := range permitted {
		quoted[i] = strconv.Quote(p)
	}
	return fmt.Sprintf("%q cannot be read here; this surface permits %s", root, strings.Join(quoted, ", "))
}
