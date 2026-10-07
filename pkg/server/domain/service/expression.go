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
	"regexp"
	"sort"
	"strconv"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/format"
	"cuelang.org/go/cue/parser"
	"github.com/getkin/kin-openapi/openapi3"
	"github.com/google/cel-go/cel"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/definition/celexpr"
	"github.com/oam-dev/kubevela/pkg/definition/propexpr"
	"github.com/oam-dev/kubevela/pkg/oam"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// The kind names the expression editor shows.
const (
	kindString = "string"
	kindInt    = "int"
	kindNumber = "number"
	kindBool   = "bool"
	kindList   = "list"
	kindObject = "object"
	kindDyn    = "dyn"
)

// ExpressionService helps forms edit the $( ) CEL expressions an application's
// properties may hold.
type ExpressionService interface {
	Env(ctx context.Context, app *model.Application, surface, source, component string) (*apisv1.ExpressionEnvResponse, error)
	Check(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest) (*apisv1.ExpressionCheckResponse, error)
	SetOptIn(ctx context.Context, app *model.Application, on bool) error
	// CheckProperties refuses properties holding an expression the check finds
	// an error in, each against the type its parameter declares in the
	// definition of typeName, a type as an Application writes it.
	CheckProperties(ctx context.Context, app *model.Application, surface, defType, typeName, properties, source, component string) error
}

type expressionServiceImpl struct {
	enabled           bool
	KubeClient        client.Client       `inject:"kubeClient"`
	Store             datastore.DataStore `inject:"datastore"`
	EnvBindingService EnvBindingService   `inject:""`
	DefinitionService DefinitionService   `inject:""`
}

// NewExpressionService offers expression editing when enabled, which should
// match the controller's EnableCelExpressions feature gate.
func NewExpressionService(enabled bool) ExpressionService {
	return &expressionServiceImpl{enabled: enabled}
}

// surfaceSource is a value in one of the application's sources: a chained
// source, resolved during a component's render, so it reads the context a
// component does and the sources declared before it.
const surfaceSource = "source"

// contextFor is the context an expression on the surface reads, and whether
// the surface is one expressions may be written on.
func contextFor(surface string) (propexpr.ContextSchema, bool) {
	if surface == surfaceSource {
		return propexpr.ContextFor("component"), true
	}
	return propexpr.ContextFor(surface), propexpr.SurfaceDeclared(surface)
}

func optedIn(app *model.Application) bool {
	return app.Annotations[oam.AnnotationCelExpressions] == True
}

// Env lists what an expression on the surface can read: the surface's context
// fields, the application's source bindings and, on a component or trait, its
// other components. On the source surface, source names the one being edited,
// which reads only those declared before it; component names the component being
// edited, or the one a trait is on, which reads every component but itself.
func (e *expressionServiceImpl) Env(ctx context.Context, app *model.Application, surface, source, component string) (*apisv1.ExpressionEnvResponse, error) {
	contextSchema, ok := contextFor(surface)
	if !ok {
		return nil, bcode.ErrExpressionSurface
	}
	resp := &apisv1.ExpressionEnvResponse{Enabled: e.enabled, OptedIn: optedIn(app), Surface: surface}
	if !e.enabled {
		return resp, nil
	}
	contextRoot := &apisv1.ExpressionVariable{Name: propexpr.ContextIdent, Type: kindObject, Description: "The application, component and cluster this value is rendered for"}
	for _, name := range contextSchema.ReadableFields() {
		if v, ok := contextSchema.FieldValue(name); ok {
			contextRoot.Children = append(contextRoot.Children, variableOf(name, v, 0))
		}
	}
	resp.Variables = append(resp.Variables, contextRoot)

	sourceRoot := &apisv1.ExpressionVariable{Name: propexpr.SourceIdent, Type: kindObject, Description: "The sources this application declares, by binding name"}
	schemas := e.sourceSchemas(ctx, app, surface, source)
	names := make([]string, 0, len(schemas))
	for name := range schemas {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		v := cuecontext.New().CompileString(schemas[name])
		binding := &apisv1.ExpressionVariable{Name: name, Type: kindObject}
		if v.Err() == nil {
			binding = variableOf(name, v, 0)
		}
		sourceRoot.Children = append(sourceRoot.Children, binding)
	}
	resp.Variables = append(resp.Variables, sourceRoot)
	if components := e.componentRoot(ctx, app, surface, component); components != nil {
		resp.Variables = append(resp.Variables, components)
	}
	return resp, nil
}

// maxVariableDepth bounds how far into a nested type the variable tree goes.
const maxVariableDepth = 6

func variableOf(name string, v cue.Value, depth int) *apisv1.ExpressionVariable {
	out := &apisv1.ExpressionVariable{Name: name, Type: kindName(v), Description: usage(v), Schema: schemaText(v)}
	if depth >= maxVariableDepth || v.IncompleteKind() != cue.StructKind {
		return out
	}
	it, err := v.Fields(cue.Optional(true))
	if err != nil {
		return out
	}
	for it.Next() {
		label := strings.TrimRight(it.Selector().String(), "?!")
		if unq, err := strconv.Unquote(label); err == nil {
			label = unq
		}
		out.Children = append(out.Children, variableOf(label, it.Value(), depth+1))
	}
	return out
}

// maxSchemaText bounds the CUE shown for one value.
const maxSchemaText = 400

// schemaText is the CUE declaring a value as written, without its comments.
// Raw keeps constraints and defaults, and leaves out the _#def wrapper an
// exported closed definition otherwise carries.
func schemaText(v cue.Value) string {
	b, err := format.Node(v.Syntax(cue.Raw(), cue.Docs(false), cue.Optional(true)))
	if err != nil {
		return ""
	}
	text := strings.TrimSpace(string(b))
	if len(text) > maxSchemaText {
		text = text[:maxSchemaText] + " ..."
	}
	return text
}

func kindName(v cue.Value) string {
	k := v.IncompleteKind() &^ cue.NullKind
	switch k {
	case cue.StringKind:
		return kindString
	case cue.IntKind:
		return kindInt
	case cue.FloatKind, cue.NumberKind:
		return kindNumber
	case cue.BoolKind:
		return kindBool
	case cue.ListKind:
		if elem := v.LookupPath(cue.MakePath(cue.AnyIndex)); elem.Exists() {
			return "list(" + kindName(elem) + ")"
		}
		return kindList
	case cue.StructKind:
		if pv := v.LookupPath(cue.MakePath(cue.AnyString)); pv.Exists() {
			if it, err := v.Fields(); err == nil && !it.Next() {
				return "map(string, " + kindName(pv) + ")"
			}
		}
		return kindObject
	}
	return kindDyn
}

// usage reads the text after +usage= in a field's doc comment, or the whole
// comment where there is none.
func usage(v cue.Value) string {
	var parts []string
	for _, cg := range v.Doc() {
		parts = append(parts, cg.Text())
	}
	doc := strings.TrimSpace(strings.Join(parts, "\n"))
	if i := strings.Index(doc, "+usage="); i >= 0 {
		doc = doc[i+len("+usage="):]
	}
	if i := strings.Index(doc, "\n"); i >= 0 {
		doc = doc[:i]
	}
	return strings.TrimSpace(doc)
}

// sourceSchemas maps each source binding an expression on the surface can read
// to the CUE of its definition's schema: the sources the application declares,
// then any only its deployed Applications carry. A source reads only the
// sources declared before the one named, all of them when it is new.
func (e *expressionServiceImpl) sourceSchemas(ctx context.Context, app *model.Application, surface, source string) map[string]string {
	out := map[string]string{}
	if e.KubeClient == nil {
		return out
	}
	add := func(src v1beta1.ApplicationSource, namespace string) {
		if _, done := out[src.Name]; done {
			return
		}
		text, err := e.sourceSchema(ctx, src.Type, namespace)
		if err != nil {
			klog.V(4).Infof("no schema for source %s of %s: %v", src.Name, app.Name, err)
			return
		}
		out[src.Name] = text
	}
	for _, src := range app.Sources {
		if surface == surfaceSource && src.Name == source {
			break
		}
		add(src, types.DefaultKubeVelaNS)
	}
	if surface == surfaceSource || e.EnvBindingService == nil {
		return out
	}
	bindings, err := e.EnvBindingService.GetEnvBindings(ctx, app)
	if err != nil {
		return out
	}
	for _, env := range bindings {
		cr := &v1beta1.Application{}
		if err := e.KubeClient.Get(ctx, client.ObjectKey{Namespace: env.AppDeployNamespace, Name: env.AppDeployName}, cr); err != nil {
			continue
		}
		for _, src := range cr.Spec.Sources {
			add(src, cr.Namespace)
		}
	}
	return out
}

func (e *expressionServiceImpl) sourceSchema(ctx context.Context, typ, namespace string) (string, error) {
	def := &v1beta1.SourceDefinition{}
	var err error
	for _, ns := range []string{namespace, types.DefaultKubeVelaNS} {
		if err = e.KubeClient.Get(ctx, client.ObjectKey{Namespace: ns, Name: typ}, def); err == nil {
			break
		}
	}
	if err != nil {
		return "", err
	}
	if def.Spec.Schematic == nil || def.Spec.Schematic.CUE == nil {
		return "", fmt.Errorf("source definition %s has no CUE template", typ)
	}
	return topLevelBlock(def.Spec.Schematic.CUE.Template, "schema")
}

// topLevelBlock returns the CUE of the template's top-level field of the given
// name, as the admission webhook reads a source's schema.
func topLevelBlock(template, name string) (string, error) {
	f, err := parser.ParseFile("-", template, parser.ParseComments)
	if err != nil {
		return "", err
	}
	for _, decl := range f.Decls {
		field, ok := decl.(*ast.Field)
		if !ok {
			continue
		}
		if label, _, err := ast.LabelName(field.Label); err != nil || label != name {
			continue
		}
		b, err := format.Node(field.Value)
		return string(b), err
	}
	return "", fmt.Errorf("no top-level %s block", name)
}

// celIssue matches the position cel-go reports an issue at.
var celIssue = regexp.MustCompile(`<input>:(\d+):(\d+): ([^\n]*)`)

// Check compiles each $( ) expression in a value against the surface's typed
// environment, and compares the value's resulting type with the parameter's.
func (e *expressionServiceImpl) Check(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest) (*apisv1.ExpressionCheckResponse, error) {
	contextSchema, ok := contextFor(req.Surface)
	if !ok {
		return nil, bcode.ErrExpressionSurface
	}
	resp := &apisv1.ExpressionCheckResponse{}
	parsed, err := propexpr.Parse(req.Value)
	if err != nil {
		resp.Issues = append(resp.Issues, &apisv1.ExpressionIssue{Message: err.Error(), Start: 0, End: len(req.Value)})
		return resp, nil
	}
	if !parsed.HasExpr() {
		resp.Type = kindString
		return resp, nil
	}
	env, err := celexpr.EnvForContext(e.sourceSchemas(ctx, app, req.Surface, req.Source), contextSchema)
	if err != nil {
		return nil, err
	}
	var whole *cel.Type
	pos := 0
	for _, frag := range parsed.Fragments {
		if !frag.IsExpr() {
			continue
		}
		start := strings.Index(req.Value[pos:], "$("+frag.Expr)
		if start < 0 {
			start = 0
		} else {
			start += pos
		}
		exprStart := start + len("$(")
		pos = exprStart + len(frag.Expr)
		if issues := e.componentIssues(ctx, app, req, frag.Expr, exprStart); len(issues) > 0 {
			resp.Issues = append(resp.Issues, issues...)
			continue
		}
		out, err := celexpr.OutputType(env, frag.Expr)
		if err != nil {
			resp.Issues = append(resp.Issues, issuesAt(err.Error(), exprStart, frag.Expr)...)
			continue
		}
		whole = out
	}
	if len(resp.Issues) > 0 {
		return resp, nil
	}
	if !parsed.Whole() {
		resp.Type = kindString
	} else {
		resp.Type = celKind(whole)
	}
	if issue := targetIssue(resp.Type, req.Kind, len(req.Value)); issue != nil {
		resp.Issues = append(resp.Issues, issue)
	}
	return resp, nil
}

// issuesAt turns cel-go's report into issues at offsets into the whole value.
func issuesAt(report string, exprStart int, expr string) []*apisv1.ExpressionIssue {
	var out []*apisv1.ExpressionIssue
	for _, m := range celIssue.FindAllStringSubmatch(report, -1) {
		col, _ := strconv.Atoi(m[2])
		at := exprStart + col
		out = append(out, &apisv1.ExpressionIssue{Message: m[3], Start: at, End: exprStart + len(expr)})
	}
	if len(out) == 0 {
		out = append(out, &apisv1.ExpressionIssue{Message: report, Start: exprStart, End: exprStart + len(expr)})
	}
	return out
}

func celKind(t *cel.Type) string {
	if t == nil {
		return kindDyn
	}
	switch t.Kind() {
	case cel.StringType.Kind():
		return kindString
	case cel.IntType.Kind(), cel.UintType.Kind():
		return kindInt
	case cel.DoubleType.Kind():
		return kindNumber
	case cel.BoolType.Kind():
		return kindBool
	case cel.ListType(cel.DynType).Kind():
		return kindList
	case cel.MapType(cel.StringType, cel.DynType).Kind():
		return "map"
	case cel.DynType.Kind():
		return kindDyn
	}
	return t.String()
}

// targetIssue reports a value type the parameter cannot take. A dyn value
// passes with a warning: the webhook refuses it against a concrete parameter
// until it is converted, as int(...) does.
func targetIssue(got, want string, end int) *apisv1.ExpressionIssue {
	expected := map[string]string{"string": "string", "integer": "int", "number": "number", "boolean": "bool"}[want]
	switch {
	case expected == "", got == expected, got == "int" && expected == "number":
		return nil
	case got == "dyn":
		return &apisv1.ExpressionIssue{Message: fmt.Sprintf("the type of this value is not known; convert it, for example %s(...)", map[string]string{"int": "int", "number": "double", "bool": "bool", "string": "string"}[expected]), Start: 0, End: end, Warning: true}
	}
	return &apisv1.ExpressionIssue{Message: fmt.Sprintf("this value is %s, but the parameter expects %s", got, expected), Start: 0, End: end}
}

// SetOptIn marks the application as reading expressions, or not. It takes
// effect at the next deploy, which carries the annotation to the Application.
func (e *expressionServiceImpl) SetOptIn(ctx context.Context, app *model.Application, on bool) error {
	if !e.enabled {
		return bcode.ErrExpressionsDisabled
	}
	if on {
		if app.Annotations == nil {
			app.Annotations = map[string]string{}
		}
		app.Annotations[oam.AnnotationCelExpressions] = True
	} else {
		delete(app.Annotations, oam.AnnotationCelExpressions)
	}
	return e.Store.Put(ctx, app)
}

// CheckProperties refuses properties holding an expression the check finds an
// error in, so one saved through the API is checked as the form checks it. A
// type with no schema, or an application that reads $( literally, is left to
// the controller.
func (e *expressionServiceImpl) CheckProperties(ctx context.Context, app *model.Application, surface, defType, typeName, properties, source, component string) error {
	if !e.enabled || !optedIn(app) || !strings.Contains(properties, "$(") {
		return nil
	}
	if _, ok := contextFor(surface); !ok {
		return nil
	}
	var values map[string]interface{}
	if err := json.Unmarshal([]byte(properties), &values); err != nil {
		return nil
	}
	name, version, _ := strings.Cut(typeName, "@")
	detail, err := e.DefinitionService.DetailDefinitionAt(ctx, name, defType, version)
	if err != nil || detail.APISchema == nil {
		return nil
	}
	check := func(path, value string, schema *openapi3.Schema) error {
		resp, err := e.Check(ctx, app, apisv1.ExpressionCheckRequest{
			Surface: surface, Value: value, Kind: expressionKind(schema), Source: source, Component: component,
		})
		if err != nil {
			return err
		}
		for _, issue := range resp.Issues {
			if !issue.Warning {
				return bcode.ErrExpressionInvalid.SetMessage(fmt.Sprintf("%s: %s", path, issue.Message))
			}
		}
		return nil
	}
	return walkExpressions("", values, detail.APISchema, check)
}

// expressionKind is the type a parameter expects, as the check names it, or
// none for any.
func expressionKind(schema *openapi3.Schema) string {
	if schema == nil || schema.Type == nil {
		return ""
	}
	for _, kind := range []string{"integer", "number", "boolean", "string"} {
		if schema.Type.Is(kind) {
			return kind
		}
	}
	return ""
}

// walkExpressions calls check on every string holding an expression, with its
// dotted path and the schema of the parameter it fills.
func walkExpressions(path string, value interface{}, schema *openapi3.Schema, check func(path, value string, schema *openapi3.Schema) error) error {
	switch v := value.(type) {
	case string:
		if strings.Contains(v, "$(") {
			return check(path, v, schema)
		}
	case map[string]interface{}:
		keys := make([]string, 0, len(v))
		for k := range v {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			var sub *openapi3.Schema
			if schema != nil {
				if ref, ok := schema.Properties[k]; ok && ref != nil {
					sub = ref.Value
				} else if schema.AdditionalProperties.Schema != nil {
					sub = schema.AdditionalProperties.Schema.Value
				}
			}
			next := k
			if path != "" {
				next = path + "." + k
			}
			if err := walkExpressions(next, v[k], sub, check); err != nil {
				return err
			}
		}
	case []interface{}:
		var item *openapi3.Schema
		if schema != nil && schema.Items != nil {
			item = schema.Items.Value
		}
		for i, element := range v {
			if err := walkExpressions(fmt.Sprintf("%s[%d]", path, i), element, item, check); err != nil {
				return err
			}
		}
	}
	return nil
}
