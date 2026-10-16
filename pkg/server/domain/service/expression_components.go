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
	"slices"
	"sort"
	"strings"

	"cuelang.org/go/cue"
	"github.com/getkin/kin-openapi/openapi3"

	"github.com/kubevela/pkg/cel/template"
	"github.com/kubevela/pkg/multicluster"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/appfile"
	"github.com/oam-dev/kubevela/pkg/appkeeper"
	"github.com/oam-dev/kubevela/pkg/definition/celexpr"
	"github.com/oam-dev/kubevela/pkg/definition/propexpr"
	velamulticluster "github.com/oam-dev/kubevela/pkg/multicluster"
	"github.com/oam-dev/kubevela/pkg/oam"
	"github.com/oam-dev/kubevela/pkg/schema"
	"github.com/oam-dev/kubevela/pkg/sources"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// readsComponents reports whether expressions on a surface may read
// component.<name>: only a component's render can wait for its producer.
func readsComponents(surface string) bool {
	return surface == "component" || surface == "trait"
}

// liveOutput is a component's applied objects as a read sees them: output is
// its workload, outputs its trait resources by trait.oam.dev/resource.
type liveOutput struct {
	output  map[string]interface{}
	outputs map[string]map[string]interface{}
}

// componentRoot is the component variable on a surface that reads components:
// every component but the one being edited, each with the fields its type and
// traits declare they apply, and those of its deployed objects on top.
func (e *expressionServiceImpl) componentRoot(ctx context.Context, app *model.Application, surface, editing string) *apisv1.ExpressionVariable {
	if !readsComponents(surface) {
		return nil
	}
	root := &apisv1.ExpressionVariable{Name: propexpr.ComponentIdent, Type: kindObject,
		Description: "The application's other components, read once healthy; the reader waits for them"}
	names, declared, crs := e.componentNames(ctx, app)
	live := e.liveOutputs(ctx, crs)
	schemas := outputSchemaReader{cli: e.KubeClient}
	for _, name := range names {
		if name == editing {
			continue
		}
		comp := &apisv1.ExpressionVariable{Name: name, Type: kindObject,
			Description: fmt.Sprintf("Component %s, beside the reader unless cluster() or namespace() names a placement", name)}
		out := live[name]
		decl := declared[name]

		var output *apisv1.ExpressionVariable
		if s := schemas.output(ctx, decl.typ); s != nil {
			output = schemaVariable("output", s, 0)
		}
		if out.output != nil {
			output = layered(output, liveVariable("output", out.output, 0))
		}
		if output == nil {
			output = &apisv1.ExpressionVariable{Name: "output", Type: kindObject}
		}
		output.Description = "The component's workload"

		resources := map[string]*apisv1.ExpressionVariable{}
		for _, def := range append([]outputsSource{{componentKind, decl.typ}}, traitSources(decl.traits)...) {
			for k, s := range schemas.outputs(ctx, def) {
				resources[k] = layered(resources[k], schemaVariable(k, s, 0))
			}
		}
		for k, obj := range out.outputs {
			resources[k] = layered(resources[k], liveVariable(k, obj, 0))
		}
		outputs := &apisv1.ExpressionVariable{Name: "outputs", Type: kindObject, Description: "The component's other resources, such as its traits', by name"}
		keys := make([]string, 0, len(resources))
		for k := range resources {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			outputs.Children = append(outputs.Children, withStatus(resources[k]))
		}
		comp.Children = []*apisv1.ExpressionVariable{withStatus(output), outputs}
		root.Children = append(root.Children, comp)
	}
	return root
}

// withStatus gives an object a status of any type in place of whatever it
// reported: its controller writes the status, so a reader casts what it takes,
// and an object that has not reported one yet still offers it.
func withStatus(obj *apisv1.ExpressionVariable) *apisv1.ExpressionVariable {
	children := obj.Children[:0]
	for _, c := range obj.Children {
		if c.Name != "status" {
			children = append(children, c)
		}
	}
	children = append(children, &apisv1.ExpressionVariable{Name: "status", Type: kindDyn,
		Description: "Written by the object's controller, so any type: cast what you read, such as int(...) or string(...)"})
	obj.Children = children
	return obj
}

// declaredComponent is a component's definition type and its traits' types,
// with where its definitions are looked up: vela-system for a component only the
// datastore declares, the deployed Application's namespace for one read from it.
type declaredComponent struct {
	typ         string
	traits      []string
	namespace   string
	annotations map[string]string
}

// componentNames is the components the application declares, from the
// datastore and from its deployed Applications, sorted, with the types each
// declares; crs are those Applications.
func (e *expressionServiceImpl) componentNames(ctx context.Context, app *model.Application) ([]string, map[string]declaredComponent, []*v1beta1.Application) {
	declared := map[string]declaredComponent{}
	add := func(name, typ string, traits []string, namespace string, annotations map[string]string) {
		d := declared[name]
		if d.typ == "" {
			d.typ, d.namespace, d.annotations = typ, namespace, annotations
		}
		for _, t := range traits {
			if !slices.Contains(d.traits, t) {
				d.traits = append(d.traits, t)
			}
		}
		declared[name] = d
	}
	if e.Store != nil {
		comps, err := e.Store.List(ctx, &model.ApplicationComponent{AppPrimaryKey: app.PrimaryKey()}, &datastore.ListOptions{})
		if err == nil {
			for _, c := range comps {
				comp := c.(*model.ApplicationComponent)
				var traits []string
				for _, t := range comp.Traits {
					traits = append(traits, t.Type)
				}
				add(comp.Name, comp.Type, traits, types.DefaultKubeVelaNS, app.Annotations)
			}
		}
	}
	crs := e.deployedApplications(ctx, app)
	for _, cr := range crs {
		for _, c := range cr.Spec.Components {
			var traits []string
			for _, t := range c.Traits {
				traits = append(traits, t.Type)
			}
			add(c.Name, c.Type, traits, cr.Namespace, cr.Annotations)
		}
	}
	names := make([]string, 0, len(declared))
	for name := range declared {
		names = append(names, name)
	}
	sort.Strings(names)
	return names, declared, crs
}

// deployedApplications is the Application each of the application's envs deploys.
func (e *expressionServiceImpl) deployedApplications(ctx context.Context, app *model.Application) []*v1beta1.Application {
	if e.KubeClient == nil || e.EnvBindingService == nil {
		return nil
	}
	bindings, err := e.EnvBindingService.GetEnvBindings(ctx, app)
	if err != nil {
		return nil
	}
	var out []*v1beta1.Application
	for _, env := range bindings {
		cr := &v1beta1.Application{}
		if err := e.KubeClient.Get(ctx, client.ObjectKey{Namespace: env.AppDeployNamespace, Name: env.AppDeployName}, cr); err == nil {
			out = append(out, cr)
		}
	}
	return out
}

// liveOutputs reads each component's applied objects, as its ResourceTracker
// records them, from the first deployed Application that applied it. The
// controller reads the same objects at the reader's placement; any placement
// shows their shape.
func (e *expressionServiceImpl) liveOutputs(ctx context.Context, crs []*v1beta1.Application) map[string]liveOutput {
	out := map[string]liveOutput{}
	for _, cr := range crs {
		root, current, _, _, err := appkeeper.ListApplicationResourceTrackers(ctx, e.KubeClient, cr)
		if err != nil {
			klog.V(4).Infof("no resource trackers for %s/%s: %v", cr.Namespace, cr.Name, err)
			continue
		}
		done := map[string]bool{}
		for name := range out {
			done[name] = true
		}
		for _, rt := range []*v1beta1.ResourceTracker{current, root} {
			if rt == nil {
				continue
			}
			for _, mr := range rt.Spec.ManagedResources {
				if mr.Deleted || mr.Component == "" || done[mr.Component] {
					continue
				}
				obj := &unstructured.Unstructured{}
				obj.SetAPIVersion(mr.APIVersion)
				obj.SetKind(mr.Kind)
				if err := e.KubeClient.Get(multicluster.WithCluster(ctx, mr.Cluster), client.ObjectKey{Namespace: mr.Namespace, Name: mr.Name}, obj); err != nil {
					continue
				}
				lo := out[mr.Component]
				if res := obj.GetLabels()[oam.TraitResource]; res != "" {
					if lo.outputs == nil {
						lo.outputs = map[string]map[string]interface{}{}
					}
					lo.outputs[res] = trimmed(obj.Object)
				} else if lo.output == nil && mr.Trait == "" {
					lo.output = trimmed(obj.Object)
				}
				out[mr.Component] = lo
			}
		}
	}
	return out
}

// trimmed drops what the API server keeps about an object rather than what it
// is: managed fields and the last-applied copies.
func trimmed(obj map[string]interface{}) map[string]interface{} {
	u := (&unstructured.Unstructured{Object: obj}).DeepCopy()
	u.SetManagedFields(nil)
	annotations := u.GetAnnotations()
	for _, k := range []string{oam.AnnotationLastAppliedConfig, oam.AnnotationLastAppliedConfiguration} {
		delete(annotations, k)
	}
	if len(annotations) == 0 {
		annotations = nil
	}
	u.SetAnnotations(annotations)
	return u.Object
}

// liveVariable is a field of a live object by its JSON type. It carries no
// schema or description: a live value is data, and the editor shows types only.
func liveVariable(name string, v interface{}, depth int) *apisv1.ExpressionVariable {
	out := &apisv1.ExpressionVariable{Name: name, Type: liveKind(v)}
	m, ok := v.(map[string]interface{})
	if !ok || depth >= maxVariableDepth {
		return out
	}
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		out.Children = append(out.Children, liveVariable(k, m[k], depth+1))
	}
	return out
}

func liveKind(v interface{}) string {
	switch t := v.(type) {
	case string:
		return kindString
	case bool:
		return kindBool
	case int64, int32, int:
		return kindInt
	case float64, float32:
		return kindNumber
	case []interface{}:
		if len(t) > 0 {
			return "list(" + liveKind(t[0]) + ")"
		}
		return kindList
	case map[string]interface{}:
		return kindObject
	}
	return kindDyn
}

// The schema ConfigMap keys the controller stores a definition's output
// schemas under, as KubeVela's types.OutputSchema and types.OutputsSchema.
const (
	componentOutputSchemaKey  = "output-schema"
	componentOutputsSchemaKey = "outputs-schema"
)

const (
	componentKind = "component"
	traitKind     = "trait"
	sourceKind    = "source"
)

// outputsSource is a definition whose template may declare outputs.
type outputsSource struct {
	kind, name string
}

func traitSources(traits []string) []outputsSource {
	out := make([]outputsSource, 0, len(traits))
	for _, t := range traits {
		out = append(out, outputsSource{traitKind, t})
	}
	return out
}

// outputSchemaReader reads definitions' output schemas from their schema
// ConfigMaps in vela-system, once each per request. A definition whose
// ConfigMap lacks them, as one stored by an older controller does, has none.
type outputSchemaReader struct {
	cli  client.Client
	data map[string]map[string]string
}

func (r *outputSchemaReader) configMap(ctx context.Context, kind, name string) map[string]string {
	if r.cli == nil || name == "" {
		return nil
	}
	key := kind + "/" + name
	if data, ok := r.data[key]; ok {
		return data
	}
	if r.data == nil {
		r.data = map[string]map[string]string{}
	}
	cm := &corev1.ConfigMap{}
	err := r.cli.Get(ctx, client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: fmt.Sprintf("%s-schema-%s", kind, name)}, cm)
	if err != nil && !apierrors.IsNotFound(err) {
		klog.V(4).Infof("no schema for %s %s: %v", kind, name, err)
	}
	r.data[key] = cm.Data
	return cm.Data
}

func (r *outputSchemaReader) output(ctx context.Context, componentType string) *openapi3.Schema {
	raw, ok := r.configMap(ctx, componentKind, componentType)[componentOutputSchemaKey]
	if !ok {
		return nil
	}
	s := &openapi3.Schema{}
	if err := s.UnmarshalJSON([]byte(raw)); err != nil {
		klog.Warningf("ignoring the output schema of component %s: %v", componentType, err)
		return nil
	}
	return s
}

func (r *outputSchemaReader) outputs(ctx context.Context, def outputsSource) map[string]*openapi3.Schema {
	raw, ok := r.configMap(ctx, def.kind, def.name)[componentOutputsSchemaKey]
	if !ok {
		return nil
	}
	var out map[string]*openapi3.Schema
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		klog.Warningf("ignoring the outputs schema of %s %s: %v", def.kind, def.name, err)
		return nil
	}
	return out
}

// schemaVariable is a field of a declared object by its OpenAPI type.
func schemaVariable(name string, s *openapi3.Schema, depth int) *apisv1.ExpressionVariable {
	out := &apisv1.ExpressionVariable{Name: name, Type: schemaKind(s)}
	if s == nil || depth >= maxVariableDepth || out.Type != "object" {
		return out
	}
	keys := make([]string, 0, len(s.Properties))
	for k := range s.Properties {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		var child *openapi3.Schema
		if ref := s.Properties[k]; ref != nil {
			child = ref.Value
		}
		out.Children = append(out.Children, schemaVariable(k, child, depth+1))
	}
	return out
}

func schemaKind(s *openapi3.Schema) string {
	if s == nil || s.Type == nil {
		return kindDyn
	}
	switch {
	case s.Type.Is(openapi3.TypeString):
		return kindString
	case s.Type.Is(openapi3.TypeInteger):
		return kindInt
	case s.Type.Is(openapi3.TypeNumber):
		return kindNumber
	case s.Type.Is(openapi3.TypeBoolean):
		return kindBool
	case s.Type.Is(openapi3.TypeArray):
		if s.Items != nil && s.Items.Value != nil {
			return "list(" + schemaKind(s.Items.Value) + ")"
		}
		return kindList
	case s.Type.Is(openapi3.TypeObject):
		return kindObject
	}
	return kindDyn
}

// layered is a declared variable with a live one laid over it: the live type
// wins unless it says less (an empty list, a null), and each keeps the fields
// the other lacks.
func layered(declared, live *apisv1.ExpressionVariable) *apisv1.ExpressionVariable {
	if declared == nil {
		return live
	}
	if live == nil {
		return declared
	}
	out := &apisv1.ExpressionVariable{Name: live.Name, Type: live.Type, Description: live.Description, Schema: live.Schema}
	if live.Type == kindDyn || (live.Type == kindList && strings.HasPrefix(declared.Type, "list(")) {
		out.Type = declared.Type
	}
	byName := map[string]*apisv1.ExpressionVariable{}
	for _, c := range declared.Children {
		byName[c.Name] = c
	}
	for _, c := range live.Children {
		byName[c.Name] = layered(byName[c.Name], c)
	}
	names := make([]string, 0, len(byName))
	for n := range byName {
		names = append(names, n)
	}
	sort.Strings(names)
	for _, n := range names {
		out.Children = append(out.Children, byName[n])
	}
	return out
}

// hyphenatedComponentRead is a component read with a dot whose name has a
// hyphen, which CEL parses as subtraction: component.my-db is component.my - db.
// It is the pattern KubeVela's celexpr.Explain names the index form for.
var hyphenatedComponentRead = regexp.MustCompile(`\bcomponent\.([A-Za-z0-9_][A-Za-z0-9_-]*-[A-Za-z0-9_-]*[A-Za-z0-9])`)

// componentIssues reports the component reads in an expression that admission
// refuses, in its words: a hyphenated name read with a dot, a read on a surface
// that cannot read components, one KubeVela's ValidateComponentReads refuses (of
// the component itself, of one the application does not have, a misplaced
// placement), and one at a cluster that is not registered.
func (e *expressionServiceImpl) componentIssues(ctx context.Context, app *model.Application, req apisv1.ExpressionCheckRequest, expr string, start int) []*apisv1.ExpressionIssue {
	if m := hyphenatedComponentRead.FindStringSubmatchIndex(expr); m != nil {
		name := expr[m[2]:m[3]]
		fixed := hyphenatedComponentRead.ReplaceAllStringFunc(expr, func(read string) string {
			return fmt.Sprintf("component[%q]", strings.TrimPrefix(read, "component."))
		})
		return []*apisv1.ExpressionIssue{{
			Message: "a component whose name has a hyphen is read by index: write " + fixed,
			Start:   start + m[0], End: start + m[1],
			Fix: fmt.Sprintf("component[%q]", name),
		}}
	}
	refs, err := celexpr.PropertyReferences(expr)
	if err != nil {
		return nil
	}
	reads := false
	for _, r := range refs {
		reads = reads || (propexpr.IsComponent(r) && len(r.Path) > 0)
	}
	if !reads {
		return nil
	}
	var out []*apisv1.ExpressionIssue
	issue := func(msg string) {
		out = append(out, &apisv1.ExpressionIssue{Message: msg, Start: start, End: start + len(expr)})
	}
	if !readsComponents(req.Surface) {
		issue(rootRefusal(propexpr.ComponentIdent, req.Surface))
		return out
	}
	reader := e.readerComponent(req, expr)
	spec := v1beta1.ApplicationSpec{Components: []common.ApplicationComponent{reader}}
	names, declared, _ := e.componentNames(ctx, app)
	for _, name := range names {
		if name != reader.Name {
			spec.Components = append(spec.Components, common.ApplicationComponent{Name: name, Type: declared[name].typ})
		}
	}
	if err := appfile.ValidateComponentReads(spec); err != nil {
		issue(err.Error())
		return out
	}
	compReads, err := sources.ComponentReads(reader)
	if err != nil {
		return out
	}
	for _, r := range compReads {
		target, err := r.Target()
		if err != nil || target.Cluster == "" || target.Cluster == velamulticluster.ClusterLocalName || e.KubeClient == nil {
			continue
		}
		if _, err := velamulticluster.GetVirtualCluster(velamulticluster.ContextInLocalCluster(ctx), e.KubeClient, target.Cluster); err != nil && velamulticluster.IsClusterNotExists(err) {
			issue(fmt.Sprintf("component %q reads %s, but no cluster %q is registered", reader.Name, r, target.Cluster))
		}
	}
	return out
}

// readerComponent is the component the expression is written in, holding it in
// its own properties or, on the trait surface, a trait's, as KubeVela reads a
// component's reads.
func (e *expressionServiceImpl) readerComponent(req apisv1.ExpressionCheckRequest, expr string) common.ApplicationComponent {
	name := req.Component
	if name == "" {
		name = "this component"
	}
	raw, _ := json.Marshal(map[string]string{"value": "$(" + expr + ")"})
	props := &runtime.RawExtension{Raw: raw}
	if req.Surface == traitKind {
		return common.ApplicationComponent{Name: name, Traits: []common.ApplicationTrait{{Properties: props}}}
	}
	return common.ApplicationComponent{Name: name, Properties: props}
}

// componentReadKind is the kind the producer declares for a component read, as
// KubeVela's admission types it, or false when it declares none and the read
// fits any parameter.
func (e *expressionServiceImpl) componentReadKind(ctx context.Context, app *model.Application, ref template.Reference) (cue.Kind, bool) {
	if e.KubeClient == nil || len(ref.Path) == 0 {
		return cue.BottomKind, false
	}
	name := ref.Path[0]
	_, declared, _ := e.componentNames(ctx, app)
	decl, ok := declared[name]
	if !ok || decl.typ == "" {
		return cue.BottomKind, false
	}
	comp := common.ApplicationComponent{Name: name, Type: decl.typ}
	for _, t := range decl.traits {
		comp.Traits = append(comp.Traits, common.ApplicationTrait{Type: t})
	}
	produced := schema.ProducedFor(ctx, e.KubeClient, decl.namespace, []common.ApplicationComponent{comp}, decl.annotations)
	return schema.ComponentReadKind(produced, ref)
}
