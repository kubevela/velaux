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
	"fmt"
	"strconv"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"

	"github.com/oam-dev/kubevela/pkg/definition/celexpr"
	"github.com/oam-dev/kubevela/pkg/definition/propexpr"
	"github.com/oam-dev/kubevela/pkg/schema"
	"github.com/oam-dev/kubevela/pkg/webhook/core.oam.dev/v1beta1/sourcedefinition"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// sourceIssues reports the source reads in an expression that admission refuses,
// in its words: a binding the application does not declare, a source reading
// one not declared before it, a definition that cannot be read, one whose
// consumableFrom leaves out the surface, and a path its schema does not declare.
func (e *expressionServiceImpl) sourceIssues(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest, expr string, start int) []*apisv1.ExpressionIssue {
	refs, err := celexpr.PropertyReferences(expr)
	if err != nil {
		return nil
	}
	var out []*apisv1.ExpressionIssue
	issue := func(msg string) {
		out = append(out, &apisv1.ExpressionIssue{Message: msg, Start: start, End: start + len(expr)})
	}
	var bindings map[string]sourceBinding
	for _, r := range refs {
		if !propexpr.IsSource(r) || len(r.Path) == 0 {
			continue
		}
		if bindings == nil {
			bindings = e.sourceBindings(ctx, app, req.Surface)
		}
		name := r.Path[0]
		b, ok := bindings[name]
		if !ok {
			issue("source is not declared in spec.sources: " + name)
			continue
		}
		if req.Surface == surfaceSource {
			if at := writtenSourceIndex(app, req.Source); b.index >= at {
				issue(fmt.Sprintf("source at index %d can only depend on prior sources, but %q is at index %d", at, name, b.index))
				continue
			}
		}
		if b.src.Type == "" || e.KubeClient == nil {
			continue
		}
		def, err := schema.SourceDefinitionFor(ctx, e.KubeClient, b.namespace, b.src.Type, b.annotations)
		if err != nil {
			issue(fmt.Sprintf("failed to load SourceDefinition %q: %v", b.src.Type, err))
			continue
		}
		tmpl := ""
		if def.Spec.Schematic != nil && def.Spec.Schematic.CUE != nil {
			tmpl = def.Spec.Schematic.CUE.Template
		}
		// A chained read is consumed wherever the outer source is, which the
		// editor of one source does not know; admission judges it there.
		if req.Surface != surfaceSource && tmpl != "" {
			surfaces, err := sourcedefinition.ParseConsumableFrom(tmpl)
			if err == nil && !sourcedefinition.SurfaceAllowed(surfaces, req.Surface) {
				issue(fmt.Sprintf("SourceDefinition %q declares consumableFrom %v and cannot be consumed from a %s",
					b.src.Type, surfaces, req.Surface))
				continue
			}
		}
		path := r.Path[1:]
		if len(path) == 0 || pathIsOpaque(path) || tmpl == "" {
			continue
		}
		text, err := schema.TopLevelBlock(tmpl, "schema")
		if err != nil || text == "" {
			continue
		}
		if !schemaHasPath(text, path) {
			issue(fmt.Sprintf("path %q is not declared in schema of SourceDefinition %q", strings.Join(path, "."), b.src.Type))
		}
	}
	return out
}

// pathIsOpaque reports a read path admission does not judge against a schema:
// one with a list index, or a key holding a dot, which a dotted path cannot name.
func pathIsOpaque(segments []string) bool {
	for _, segment := range segments {
		if strings.Contains(segment, ".") {
			return true
		}
		if _, err := strconv.Atoi(segment); err == nil {
			return true
		}
	}
	return false
}

// schemaHasPath reports whether a source's schema declares a read path, as
// admission walks it: a field, optional or not, a key of an open map, and
// anything below a value of any type.
func schemaHasPath(text string, path []string) bool {
	v := cuecontext.New().CompileString("schema: " + text)
	if v.Err() != nil {
		return true
	}
	cur := v.LookupPath(cue.ParsePath("schema"))
	for _, seg := range path {
		if cur.IncompleteKind() == cue.TopKind {
			return true
		}
		next := cur.LookupPath(cue.MakePath(cue.Str(seg)))
		if next.Exists() {
			cur = next
			continue
		}
		if opt, ok := optionalField(cur, seg); ok {
			cur = opt
			continue
		}
		if pattern := cur.LookupPath(cue.MakePath(cue.AnyString)); pattern.Exists() {
			cur = pattern
			continue
		}
		return false
	}
	return cur.Exists()
}

func optionalField(parent cue.Value, label string) (cue.Value, bool) {
	iter, err := parent.Fields(cue.Optional(true), cue.Definitions(false))
	if err != nil {
		return cue.Value{}, false
	}
	for iter.Next() {
		if sel := iter.Selector(); sel.IsString() && sel.Unquoted() == label {
			return iter.Value(), true
		}
	}
	return cue.Value{}, false
}
