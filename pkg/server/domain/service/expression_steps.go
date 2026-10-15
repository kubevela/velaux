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
	"fmt"
	"slices"
	"strconv"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
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
			quoted := make([]string, len(permitted))
			for i, p := range permitted {
				quoted[i] = strconv.Quote(p)
			}
			issue(fmt.Sprintf("%q cannot be read here; this surface permits %s", r.Root, strings.Join(quoted, ", ")))
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

// stepReadIssue is what is wrong with a steps.<name>.outputs.<output> read, or
// "" when nothing is or the request does not list the workflow's steps.
func stepReadIssue(step apisv1.ExpressionStep, r template.Reference) string {
	if len(r.Path) < 3 || r.Path[1] != "outputs" {
		name := "<step>"
		if len(r.Path) > 0 {
			name = r.Path[0]
		}
		return fmt.Sprintf("read steps.%s.outputs.<name>", name)
	}
	if step.Steps == nil {
		return ""
	}
	name, output := r.Path[0], r.Path[2]
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

// readKind is the kind admission gives a value that is exactly one component or
// each read: a component's from what it applies, the loop's from its items, an
// item read from a source typed by that source's schema.
func (e *expressionServiceImpl) readKind(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest,
	sourceSchemas map[string]string) (string, bool) {
	ref, ok := schema.BareRead(req.Value)
	if !ok {
		return "", false
	}
	var kind cue.Kind
	switch ref.Root {
	case propexpr.ComponentIdent:
		kind, ok = e.componentReadKind(ctx, app, ref)
	case propexpr.EachIdent:
		compiled := propexpr.CompileSchemas(sourceSchemas)
		kind, ok = schema.EachReadKind(schema.LoopItemKind(req.ForEachItems, compiled.Kind), ref)
	default:
		return "", false
	}
	if !ok {
		return "", false
	}
	return kindLabel(kind)
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
		return kindMap, true
	}
	return "", false
}

// stepRoots are the roots only a workflow step reads: steps, every other step
// the request lists with the outputs it declares, and, in a loop body, each.
func stepRoots(step apisv1.ExpressionStep, sourceSchemas map[string]string) []*apisv1.ExpressionVariable {
	steps := &apisv1.ExpressionVariable{Name: propexpr.StepsIdent, Type: kindObject,
		Description: "The workflow's other steps, by name: read an output one declares, which the step then waits for"}
	for _, s := range step.Steps {
		if s.Name == step.Step || len(s.Outputs) == 0 {
			continue
		}
		outputs := &apisv1.ExpressionVariable{Name: "outputs", Type: kindObject, Description: "The outputs the step declares"}
		for _, o := range s.Outputs {
			outputs.Children = append(outputs.Children, &apisv1.ExpressionVariable{Name: o, Type: kindDyn,
				Description: "Declared without a type: cast what you read, such as int(...) or string(...)"})
		}
		steps.Children = append(steps.Children, &apisv1.ExpressionVariable{Name: s.Name, Type: kindObject,
			Children: []*apisv1.ExpressionVariable{outputs}})
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
