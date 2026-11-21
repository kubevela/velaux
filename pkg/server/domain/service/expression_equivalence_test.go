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
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	goruntime "runtime"
	"strings"
	"testing"

	wfv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/appfile"
	"github.com/oam-dev/kubevela/pkg/features"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	appwebhook "github.com/oam-dev/kubevela/pkg/webhook/core.oam.dev/v1beta1/application"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/validation/field"
	utilfeature "k8s.io/apiserver/pkg/util/feature"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/yaml"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// The equivalence harness runs each case through VelaUX's expression check and
// KubeVela's admission, over one set of definitions, and asserts they agree on
// whether the value is refused, and that VelaUX's message carries admission's.

// value is where a case's expression goes in the Application it builds.
const value = "@@"

// eqNS is the namespace the Application is deployed to.
const eqNS = "prod"

// eqDefinitions are every definition the cases read, in one fake client.
func eqDefinitions() []client.Object {
	comp := func(name, ns, tmpl string) client.Object {
		return &v1beta1.ComponentDefinition{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns},
			Spec: v1beta1.ComponentDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: tmpl}}}}
	}
	trait := func(name, tmpl string) client.Object {
		return &v1beta1.TraitDefinition{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: velaNS},
			Spec: v1beta1.TraitDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: tmpl}}}}
	}
	src := func(name, ns, tmpl string) *v1beta1.SourceDefinition {
		return &v1beta1.SourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns},
			Spec: v1beta1.SourceDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: tmpl}}}}
	}
	databaseV1 := &v1beta1.ComponentDefinition{ObjectMeta: metav1.ObjectMeta{Name: "database", Namespace: velaNS},
		Spec: v1beta1.ComponentDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: `
parameter: {host: *1 | int}
output: {apiVersion: "v1", kind: "ConfigMap", data: host: parameter.host}
`}}}}
	atlasV1 := src("atlas", velaNS, "parameter: {}\nschema: {region: string}\noutput: {}\n")
	return []client.Object{
		comp("reader", velaNS, `
parameter: {
	text: *"" | string
	num: *0 | int
	flag: *false | bool
	obj: *{} | {...}
	req: string
}
output: {apiVersion: "v1", kind: "ConfigMap", data: t: parameter.text}
`),
		comp("database", velaNS, `
parameter: {host: *"db" | string, port: *5432 | int}
output: {apiVersion: "v1", kind: "ConfigMap", data: {host: parameter.host, port: parameter.port}}
`),
		&v1beta1.DefinitionRevision{ObjectMeta: metav1.ObjectMeta{Name: "database-v1", Namespace: velaNS},
			Spec: v1beta1.DefinitionRevisionSpec{Revision: 1, DefinitionType: common.ComponentType, ComponentDefinition: *databaseV1}},
		comp("web", velaNS, `
parameter: {replicas: *1 | int}
output: {apiVersion: "apps/v1", kind: "Deployment", spec: replicas: parameter.replicas}
`),
		comp("cache", eqNS, `
parameter: {size: *1 | int}
output: {apiVersion: "v1", kind: "ConfigMap", data: size: parameter.size}
`),
		trait("scaler", "parameter: replicas: *1 | int\npatch: spec: replicas: parameter.replicas\n"),
		trait("gateway", "parameter: port: *80 | int\noutputs: ingress: {apiVersion: \"v1\", kind: \"Ingress\", spec: port: parameter.port}\n"),
		trait("gateway2", "parameter: host: *\"x\" | string\noutputs: ingress: {apiVersion: \"v1\", kind: \"Ingress\", spec: host: parameter.host}\n"),
		trait("labeller", "parameter: {}\npatchOutputs: ingress: metadata: labels: team: \"shop\"\n"),
		trait("annotate", "parameter: {text: *\"\" | string, num: *0 | int}\noutputs: note: {apiVersion: \"v1\", kind: \"ConfigMap\", data: t: parameter.text}\n"),
		src("settings", velaNS, `
parameter: {key: *"" | string}
schema: {
	name: string
	port: int
	on: bool
	labels: [string]: string
	regions: [...{name: string, zone: int}]
	maybe?: bool
}
output: {}
`),
		src("atlas", velaNS, "parameter: {}\nschema: {region: int}\noutput: {}\n"),
		&v1beta1.DefinitionRevision{ObjectMeta: metav1.ObjectMeta{Name: "atlas-v1", Namespace: velaNS},
			Spec: v1beta1.DefinitionRevisionSpec{Revision: 1, DefinitionType: common.SourceType, SourceDefinition: *atlasV1}},
		src("plain", velaNS, "parameter: {}\noutput: {}\n"),
		src("narrow", velaNS, "consumableFrom: [\"workflowstep\"]\nparameter: {}\nschema: {name: string}\noutput: {}\n"),
		src("lookup", velaNS, "parameter: {key: string, n: *0 | int}\nschema: {value: string}\noutput: {value: parameter.key}\n"),
		&v1beta1.WorkflowStepDefinition{ObjectMeta: metav1.ObjectMeta{Name: "notify", Namespace: velaNS},
			Spec: v1beta1.WorkflowStepDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: `
parameter: {text: *"" | string, num: *0 | int, flag: *false | bool, must: string}
`}}}},
		&v1beta1.PolicyDefinition{ObjectMeta: metav1.ObjectMeta{Name: "tagger", Namespace: velaNS},
			Spec: v1beta1.PolicyDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: `
parameter: {text: *"" | string}
`}}}},
	}
}

// producers are the components the reader reads, with no expressions of their
// own: db and my-db apply a ConfigMap with a string host and an int port; pinned
// is db's type at v1, an int host; api's trait patches its workload; gw adds an
// ingress; edge adds one and patches the resources; dup adds the same ingress
// twice; ghosttrait has a trait with no definition; ghost a type with none;
// local a type defined only in the Application's namespace.
var producers = []common.ApplicationComponent{
	{Name: "db", Type: "database"},
	{Name: "my-db", Type: "database"},
	{Name: "pinned", Type: "database@v1"},
	{Name: "api", Type: "web", Traits: []common.ApplicationTrait{{Type: "scaler"}}},
	{Name: "gw", Type: "web", Traits: []common.ApplicationTrait{{Type: "gateway"}}},
	{Name: "edge", Type: "web", Traits: []common.ApplicationTrait{{Type: "gateway"}, {Type: "labeller"}}},
	{Name: "dup", Type: "web", Traits: []common.ApplicationTrait{{Type: "gateway"}, {Type: "gateway2"}}},
	{Name: "ghosttrait", Type: "web", Traits: []common.ApplicationTrait{{Type: "nowhere"}}},
	{Name: "ghost", Type: "nowhere"},
	{Name: "local", Type: "cache"},
}

// eqSources are the Application's sources.
var eqSources = []v1beta1.ApplicationSource{
	{Name: "cfg", Type: "settings"},
	{Name: "geo", Type: "atlas@v1"},
	{Name: "raw", Type: "plain"},
	{Name: "only", Type: "narrow"},
	{Name: "gone", Type: "nowhere"},
}

func rawProps(kv map[string]interface{}) *runtime.RawExtension {
	b, _ := json.Marshal(kv)
	return &runtime.RawExtension{Raw: b}
}

func rawItems(v interface{}) *wfv1alpha1.ForEach {
	b, _ := json.Marshal(v)
	return &wfv1alpha1.ForEach{Items: &apiextensionsv1.JSON{Raw: b}}
}

// eqCase is one value checked by both.
type eqCase struct {
	name string
	// value is the expression.
	value string
	// spec builds the Application, with value where the expression goes.
	spec func() v1beta1.ApplicationSpec
	// path is where admission reports the value.
	path string
	// req is VelaUX's check request, less the value and the step scope.
	req apisv1.ExpressionCheckRequest
	// step is the workflow step the value is in; cond marks its if.
	step string
	cond bool
	// refuse is what both should say.
	refuse bool
	// wording, when set, is why VelaUX's message legitimately differs from
	// admission's, and shared what both still say.
	wording, shared string
	// once is that both report it exactly once.
	once bool
	// unchecked, when set, is why VelaUX does not check the value at all.
	unchecked string
	// defs are definitions the case adds to the shared ones.
	defs func(t *testing.T) []client.Object
}

// reader is the component whose properties hold the value.
func reader(props map[string]interface{}, traits ...common.ApplicationTrait) func() v1beta1.ApplicationSpec {
	return func() v1beta1.ApplicationSpec {
		return v1beta1.ApplicationSpec{
			Components: append([]common.ApplicationComponent{{Name: "reader", Type: "reader", Properties: rawProps(props), Traits: traits}}, producers...),
			Sources:    eqSources,
		}
	}
}

// inTrait is the reader with a trait whose properties hold the value.
func inTrait(param string) func() v1beta1.ApplicationSpec {
	return reader(map[string]interface{}{"req": "x"}, common.ApplicationTrait{Type: "annotate", Properties: rawProps(map[string]interface{}{param: value})})
}

// withWorkflow is the Application with a workflow.
func withWorkflow(steps ...wfv1alpha1.WorkflowStep) func() v1beta1.ApplicationSpec {
	return func() v1beta1.ApplicationSpec {
		spec := reader(map[string]interface{}{"req": "x"})()
		spec.Workflow = &v1beta1.Workflow{Steps: steps}
		return spec
	}
}

func eqStep(name string, props map[string]interface{}, outputs ...string) wfv1alpha1.WorkflowStep {
	s := wfv1alpha1.WorkflowStep{WorkflowStepBase: wfv1alpha1.WorkflowStepBase{Name: name, Type: "notify"}}
	if props != nil {
		s.Properties = rawProps(props)
	}
	for _, o := range outputs {
		s.Outputs = append(s.Outputs, wfv1alpha1.OutputItem{Name: o, ValueFrom: "x"})
	}
	return s
}

// names is a step declaring an output, list, every workflow case has first.
var names = eqStep("names", nil, "list")

func stepIf(s wfv1alpha1.WorkflowStep, cond string) wfv1alpha1.WorkflowStep {
	s.If = cond
	return s
}

func looping(s wfv1alpha1.WorkflowStep, f *wfv1alpha1.ForEach) wfv1alpha1.WorkflowStep {
	s.ForEach = f
	return s
}

func group(name string, f *wfv1alpha1.ForEach, subs ...wfv1alpha1.WorkflowStep) wfv1alpha1.WorkflowStep {
	g := wfv1alpha1.WorkflowStep{WorkflowStepBase: wfv1alpha1.WorkflowStepBase{Name: name, Type: "step-group"}, ForEach: f}
	for _, s := range subs {
		g.SubSteps = append(g.SubSteps, s.WorkflowStepBase)
	}
	return g
}

var (
	compText = apisv1.ExpressionCheckRequest{Surface: "component", Component: "reader", Kind: "string"}
	compNum  = apisv1.ExpressionCheckRequest{Surface: "component", Component: "reader", Kind: "integer"}
	compReq  = apisv1.ExpressionCheckRequest{Surface: "component", Component: "reader", Kind: "string", Required: true}
	compObj  = apisv1.ExpressionCheckRequest{Surface: "component", Component: "reader"}
	stepText = apisv1.ExpressionCheckRequest{Surface: "workflowstep", Kind: "string"}
	stepNum  = apisv1.ExpressionCheckRequest{Surface: "workflowstep", Kind: "integer"}
	stepIfR  = apisv1.ExpressionCheckRequest{Surface: "workflowstep"}
)

const (
	pText   = "spec.components[0].properties.text"
	pNum    = "spec.components[0].properties.num"
	pReq    = "spec.components[0].properties.req"
	pObj    = "spec.components[0].properties.obj"
	pTrait  = "spec.components[0].traits[0].properties.text"
	pTraitN = "spec.components[0].traits[0].properties.num"
)

// mismatchWording is why a type mismatch reads differently: VelaUX's sits on the
// field, so it says "the parameter" where admission names the expression and the
// definition; both name the type found and the type wanted.
const mismatchWording = "type mismatch, worded for the field"

var (
	admissionMismatch      = regexp.MustCompile(`is (\S+) but .* expects (\S+)$`)
	admissionInputMismatch = regexp.MustCompile(`expected (\S+), got (\S+)$`)
	velauxMismatch         = regexp.MustCompile(`this value is (\S+), but the parameter expects (\S+)`)
)

func eqCases() []eqCase {
	r := func(param string) map[string]interface{} {
		m := map[string]interface{}{"req": "x"}
		m[param] = value
		return m
	}
	comp := func(name, param string, req apisv1.ExpressionCheckRequest, refuse bool, expr string) eqCase {
		c := eqCase{name: name, value: expr, spec: reader(r(param)), path: "spec.components[0].properties." + param, req: req, refuse: refuse}
		if refuse {
			c.wording = mismatchWording
		}
		return c
	}
	// A workflow: names declares an output; use is the step holding the value,
	// declaring its own output, mine.
	use := func(props map[string]interface{}) wfv1alpha1.WorkflowStep { return eqStep("use", props, "mine") }
	step := func(name, param string, req apisv1.ExpressionCheckRequest, refuse bool, expr, wording string) eqCase {
		return eqCase{name: name, value: expr, spec: withWorkflow(names, use(map[string]interface{}{param: value})),
			path: "spec.workflow.steps[1].properties." + param, req: req, step: "use", refuse: refuse, wording: wording}
	}
	loop := func(name string, f *wfv1alpha1.ForEach, param string, req apisv1.ExpressionCheckRequest, refuse bool, expr, wording string) eqCase {
		return eqCase{name: name, value: expr, spec: withWorkflow(names, looping(use(map[string]interface{}{param: value}), f)),
			path: "spec.workflow.steps[1].properties." + param, req: req, step: "use", refuse: refuse, wording: wording}
	}
	sub := func(name string, f *wfv1alpha1.ForEach, param string, req apisv1.ExpressionCheckRequest, refuse bool, expr, wording string) eqCase {
		return eqCase{name: name, value: expr, spec: withWorkflow(names, group("rollout", f, use(map[string]interface{}{param: value}))),
			path: "spec.workflow.steps[1].subSteps[0].properties." + param, req: req, step: "use", refuse: refuse, wording: wording}
	}
	cond := func(name string, refuse bool, expr string) eqCase {
		return eqCase{name: name, value: expr, spec: withWorkflow(names, stepIf(use(nil), value)),
			path: "spec.workflow.steps[1].if", req: stepIfR, step: "use", cond: true, refuse: refuse}
	}
	chained := func(name, param string, kind string, refuse bool, expr string) eqCase {
		spec := func() v1beta1.ApplicationSpec {
			s := reader(map[string]interface{}{"req": "x"})()
			s.Sources = append(append([]v1beta1.ApplicationSource{}, eqSources...),
				v1beta1.ApplicationSource{Name: "second", Type: "lookup", Properties: rawProps(map[string]interface{}{"key": "k", param: value})})
			return s
		}
		c := eqCase{name: name, value: expr, spec: spec, path: fmt.Sprintf("spec.sources[%d].properties.", len(eqSources)) + param,
			req: apisv1.ExpressionCheckRequest{Surface: "source", Source: "second", Kind: kind}, refuse: refuse}
		if refuse {
			c.wording = mismatchWording
		}
		return c
	}
	// shipped reads a component of a type KubeVela ships into the int parameter.
	shipped := func(name, typ, expr string, refuse bool) eqCase {
		c := comp(name, "num", compNum, refuse, expr)
		inner := c.spec
		c.spec = func() v1beta1.ApplicationSpec {
			s := inner()
			s.Components = append(s.Components, common.ApplicationComponent{Name: "shipped", Type: typ})
			return s
		}
		c.defs = func(t *testing.T) []client.Object { return []client.Object{shippedComponent(t, typ)} }
		return c
	}
	ints := rawItems([]int{1, 2})
	strs := rawItems([]string{"a", "b"})
	mixed := rawItems([]interface{}{1, "a"})
	objs := rawItems([]map[string]interface{}{{"n": 1}, {"n": 2}})
	fromSource := rawItems("$(source.cfg.regions)")
	computed := rawItems("$(source.cfg.regions.map(r, r.name))")
	fromVar := &wfv1alpha1.ForEach{From: "regions"}
	stepFlag := apisv1.ExpressionCheckRequest{Surface: "workflowstep", Kind: "boolean"}
	// someWave's items leave wave out of one and have an empty ports list in
	// one; allWave's all have both.
	someWave := rawItems([]map[string]interface{}{{"wave": 1, "ports": []int{80}}, {"ports": []int{}}})
	allWave := rawItems([]map[string]interface{}{{"wave": 1, "ports": []int{80}}, {"wave": 2, "ports": []int{81}}})
	guard := "the has() rule worded for the field: VelaUX says \"a required parameter\" where admission names the definition"
	// subIf is the if of a step in a group looping over f, which decides it per pass.
	subIf := func(name string, f *wfv1alpha1.ForEach, refuse bool, expr string) eqCase {
		return eqCase{name: name, value: expr, spec: withWorkflow(names, group("rollout", f, stepIf(use(nil), value))),
			path: "spec.workflow.steps[1].subSteps[0].if", req: stepIfR, step: "use", cond: true, refuse: refuse}
	}
	// loopReq is the required parameter must of a step looping over f.
	loopReq := func(name string, f *wfv1alpha1.ForEach, refuse bool, expr string) eqCase {
		c := loop(name, f, "must", apisv1.ExpressionCheckRequest{Surface: "workflowstep", Kind: "string", Required: true}, refuse, expr, "")
		if refuse {
			c.wording, c.shared = guard, "may be absent and feeds"
		}
		return c
	}

	return []eqCase{
		// Component reads.
		comp("component string into string", "text", compText, false, "$(component.db.output.data.host)"),
		comp("component string into int", "num", compNum, true, "$(component.db.output.data.host)"),
		comp("component int into int", "num", compNum, false, "$(component.db.output.data.port)"),
		comp("component int into string", "text", compText, true, "$(component.db.output.data.port)"),
		comp("component struct into string", "text", compText, true, "$(component.db.output.data)"),
		comp("component struct into struct", "obj", compObj, false, "$(component.db.output.data)"),
		comp("component unknown live field", "num", compNum, false, "$(component.db.output.data.timeout)"),
		comp("component status", "num", compNum, false, "$(component.db.output.status.ready)"),
		comp("component under a patch trait", "num", compNum, false, "$(component.api.output.kind)"),
		comp("component resource under patchOutputs", "text", compText, false, "$(component.edge.outputs.ingress.spec.port)"),
		comp("component trait-added resource", "text", compText, true, "$(component.gw.outputs.ingress.spec.port)"),
		comp("component duplicate resource", "text", compText, false, "$(component.dup.outputs.ingress.spec.port)"),
		comp("component missing trait definition", "num", compNum, false, "$(component.ghosttrait.output.kind)"),
		comp("component missing component definition", "num", compNum, false, "$(component.ghost.output.kind)"),
		comp("component type@v1 revision", "text", compText, true, "$(component.pinned.output.data.host)"),
		comp("component namespaced definition", "text", compText, true, "$(component.local.output.data.size)"),
		comp("component hyphenated by index", "num", compNum, true, `$(component["my-db"].output.data.host)`),
		comp("component placement, wrong type", "num", compNum, true, `$(component.db.namespace("other").output.data.host)`),
		comp("component placement, right type", "text", compText, false, `$(component.db.namespace("other").output.data.host)`),
		{name: "component hyphenated by dot", value: "$(component.my-db.output.data.host)", spec: reader(r("text")), path: pText, req: compText, refuse: true,
			wording: "admission leads with CEL's parse of the subtraction; VelaUX, which offers the rewrite as a quick fix, leads with the rule",
			shared:  `a component whose name has a hyphen is read by index: write component["my-db"].output.data.host`},
		{name: "component unregistered cluster", value: `$(component.db.cluster("east").output.data.host)`, spec: reader(r("text")), path: pText, req: compText, refuse: true},
		comp("component interpolated", "num", compNum, true, "port-$(component.db.output.data.port)"),
		comp("component computed", "num", compNum, false, "$(int(component.db.output.data.host))"),
		comp("component guarded", "text", compText, false, `$(has(component.db.output.data.host) ? component.db.output.data.host : "none")`),
		{name: "component read in a trait", value: "$(component.db.output.data.host)", spec: inTrait("num"), path: pTraitN,
			req: apisv1.ExpressionCheckRequest{Surface: "trait", Component: "reader", Kind: "integer"}, refuse: true, wording: mismatchWording},
		shipped("component of the shipped daemon", "daemon", "$(component.shipped.output.kind)", true),
		shipped("component of the shipped daemon, field it writes", "daemon", "$(component.shipped.output.spec.selector)", true),
		shipped("component of the shipped addon", "addon", "$(component.shipped.output.kind)", false),
		shipped("component of the shipped module", "module", "$(component.shipped.output.kind)", false),
		{name: "component reads itself", value: "$(component.reader.output.data.t)", spec: reader(r("text")), path: pText, req: compText, refuse: true},
		{name: "component unknown", value: "$(component.nope.output.data.t)", spec: reader(r("text")), path: pText, req: compText, refuse: true},

		// Source reads.
		comp("source string into string", "text", compText, false, "$(source.cfg.name)"),
		comp("source string into int", "num", compNum, true, "$(source.cfg.name)"),
		comp("source int into int", "num", compNum, false, "$(source.cfg.port)"),
		comp("source list into string", "text", compText, true, "$(source.cfg.regions)"),
		comp("source map into string", "text", compText, true, "$(source.cfg.labels)"),
		{name: "source with no schema", value: "$(source.raw.x)", spec: reader(r("num")), path: pNum, req: compNum, refuse: false},
		{name: "source with no definition", value: "$(source.gone.x)", spec: reader(r("num")), path: pNum, req: compNum, refuse: true, once: true},
		{name: "source not consumable here", value: "$(source.only.name)", spec: reader(r("text")), path: pText, req: compText, refuse: true},
		step("source consumable on a step", "text", stepText, false, "$(source.only.name)", ""),
		{name: "source undeclared binding", value: "$(source.nope.x)", spec: reader(r("text")), path: pText, req: compText, refuse: true},
		{name: "source unknown field", value: "$(source.cfg.nope)", spec: reader(r("text")), path: pText, req: compText, refuse: true},
		comp("source pinned revision", "num", compNum, true, "$(source.geo.region)"),
		{name: "source map field into a required parameter", value: "$(source.cfg.labels.team)", spec: reader(map[string]interface{}{"req": value}),
			path: pReq, req: compReq, refuse: true, wording: "VelaUX's sits on the field, so it says \"a required parameter\" where admission names the definition",
			shared: "guard it with has(source.cfg.labels.team) ? source.cfg.labels.team : <fallback>"},
		{name: "source map field guarded", value: `$(has(source.cfg.labels.team) ? source.cfg.labels.team : "none")`,
			spec: reader(map[string]interface{}{"req": value}), path: pReq, req: compReq, refuse: false},
		comp("source optional field into an optional parameter", "flag",
			apisv1.ExpressionCheckRequest{Surface: "component", Component: "reader", Kind: "boolean"}, false, "$(source.cfg.maybe)"),
		chained("source chained, wrong type", "key", "string", true, "$(source.cfg.port)"),
		chained("source chained, right type", "n", "integer", false, "$(source.cfg.port)"),

		// each.
		loop("each literal ints into int", ints, "num", stepNum, false, "$(each.item)", ""),
		loop("each literal ints into string", ints, "text", stepText, true, "$(each.item)", mismatchWording),
		loop("each literal strings into int", strs, "num", stepNum, true, "$(each.item)", mismatchWording),
		loop("each mixed items", mixed, "num", stepNum, false, "$(each.item)", ""),
		loop("each object items", objs, "text", stepText, true, "$(each.item.n)", mismatchWording),
		loop("each items from a typed source list", fromSource, "text", stepText, true, "$(each.item.zone)", mismatchWording),
		loop("each computed items", computed, "num", stepNum, false, "$(each.item)", ""),
		loop("each items from a workflow variable", fromVar, "num", stepNum, false, "$(each.item)", ""),
		loop("each.index into string", ints, "text", stepText, true, "$(each.index)", mismatchWording),
		loop("each.index into int", ints, "num", stepNum, false, "$(each.index)", ""),
		step("each outside a loop", "num", stepNum, true, "$(each.index)", ""),
		sub("each in a looping group's sub-step", objs, "text", stepText, true, "$(each.item.n)", mismatchWording),
		sub("each in a plain group's sub-step", nil, "num", stepNum, true, "$(each.index)", ""),

		// steps.
		step("steps declared output", "text", stepText, false, "$(steps.names.outputs.list)", ""),
		step("steps undeclared output", "text", stepText, true, "$(steps.names.outputs.nope)", ""),
		step("steps unknown step", "text", stepText, true, "$(steps.gone.outputs.list)", ""),
		step("steps own outputs", "text", stepText, true, "$(steps.use.outputs.mine)", ""),
		step("steps own status", "flag", stepFlag, true, "$(steps.use.failed)", ""),
		step("steps status field", "text", stepText, false, "$(steps.names.phase)", ""),
		step("steps status bool", "flag", stepFlag, false, "$(steps.names.succeeded)", ""),
		step("steps bogus field", "text", stepText, true, "$(steps.names.bogus)", ""),
		{name: "steps later step in parallel", value: "$(steps.use.outputs.mine)",
			spec: func() v1beta1.ApplicationSpec {
				s := withWorkflow(eqStep("first", map[string]interface{}{"text": value}), use(nil))()
				s.Workflow.Mode = &wfv1alpha1.WorkflowExecuteMode{Steps: wfv1alpha1.WorkflowMode("DAG")}
				return s
			}, path: "spec.workflow.steps[0].properties.text", req: stepText, step: "first", refuse: false},
		{name: "steps read closing a dependsOn cycle", value: "$(steps.use.outputs.mine)",
			spec: func() v1beta1.ApplicationSpec {
				first := eqStep("first", map[string]interface{}{"text": value})
				later := use(nil)
				later.DependsOn = []string{"first"}
				s := withWorkflow(first, later)()
				s.Workflow.Mode = &wfv1alpha1.WorkflowExecuteMode{Steps: wfv1alpha1.WorkflowMode("DAG")}
				return s
			}, path: "spec.workflow.steps[0].properties.text", req: stepText, step: "first", refuse: true},
		{name: "steps output declared twice", value: "$(steps.names.outputs.list)",
			spec: withWorkflow(names, eqStep("other", nil, "list"), use(map[string]interface{}{"text": value})),
			path: "spec.workflow.steps[2].properties.text", req: stepText, step: "use", refuse: true},
		{name: "steps later step in order", value: "$(steps.use.outputs.mine)",
			spec: withWorkflow(eqStep("first", map[string]interface{}{"text": value}), use(nil)),
			path: "spec.workflow.steps[0].properties.text", req: stepText, step: "first", refuse: true},

		// Conditions.
		cond("condition bool field", false, "$(source.cfg.on)"),
		cond("condition comparison", false, "$(source.cfg.port == 80)"),
		cond("condition string field", true, "$(source.cfg.name)"),
		cond("condition non-bool context", true, "$(context.appName)"),
		cond("condition unguarded optional read", true, "$(source.cfg.maybe)"),
		cond("condition guarded optional read", false, "$(has(source.cfg.maybe) ? source.cfg.maybe : false)"),
		cond("condition step status", false, "$(steps.names.succeeded)"),
		cond("condition own status", true, "$(steps.use.failed)"),
		{name: "condition each in a loop step's own if", value: "$(each.item)",
			spec: withWorkflow(names, stepIf(looping(use(nil), rawItems([]bool{true})), value)),
			path: "spec.workflow.steps[1].if", req: stepIfR, step: "use", cond: true, refuse: true},
		{name: "condition each in a looping sub-step's if", value: "$(each.item.on)",
			spec: withWorkflow(names, group("rollout", rawItems([]map[string]bool{{"on": true}}), stepIf(use(nil), value))),
			path: "spec.workflow.steps[1].subSteps[0].if", req: stepIfR, step: "use", cond: true, refuse: false},
		subIf("condition each field some items lack", someWave, true, "$(each.item.wave > 0)"),
		subIf("condition each field some items lack, guarded", someWave, false, "$(has(each.item.wave) && each.item.wave > 0)"),
		subIf("condition each field every item has", allWave, false, "$(each.item.wave > 0)"),
		subIf("condition each index past one item's list", someWave, true, "$(each.item.ports[0] > 0)"),
		subIf("condition each index every item's list has", allWave, false, "$(each.item.ports[0] > 0)"),
		loopReq("each field some items lack into a required parameter", someWave, true, "$(string(each.item.wave))"),
		loopReq("each field some items lack into a required parameter, guarded", someWave, false,
			`$(has(each.item.wave) ? string(each.item.wave) : "0")`),
		loopReq("each index past one item's list into a required parameter", someWave, true, "$(string(each.item.ports[0]))"),
		loopReq("each index every item's list has into a required parameter", allWave, false, "$(string(each.item.ports[0]))"),
		cond("condition CUE always", false, "always"),
		cond("condition CUE status", false, "status.names.succeeded"),
		cond("condition CUE string holding $(", false, `context.appName == "$(x)"`),

		// Surfaces.
		step("surface component read on a step", "text", stepText, true, "$(component.db.output.data.host)", ""),
		{name: "surface steps in a component", value: "$(steps.names.outputs.list)", spec: reader(r("text")), path: pText, req: compText, refuse: true},
		{name: "surface source in a built-in policy", value: "$(source.cfg.name)",
			spec: func() v1beta1.ApplicationSpec {
				s := reader(map[string]interface{}{"req": "x"})()
				s.Policies = []v1beta1.AppPolicy{{Name: "where", Type: "topology", Properties: rawProps(map[string]interface{}{"namespace": value})}}
				return s
			}, path: "spec.policies[0].properties.namespace", req: apisv1.ExpressionCheckRequest{Surface: "policy", Kind: "string"}, refuse: true,
			unchecked: "VelaUX's policy forms take no expressions, and a save leaves a policy's to admission"},
		{name: "surface source in a rendered policy", value: "$(source.cfg.name)",
			spec: func() v1beta1.ApplicationSpec {
				s := reader(map[string]interface{}{"req": "x"})()
				s.Policies = []v1beta1.AppPolicy{{Name: "tags", Type: "tagger", Properties: rawProps(map[string]interface{}{"text": value})}}
				return s
			}, path: "spec.policies[0].properties.text", req: apisv1.ExpressionCheckRequest{Surface: "policy", Kind: "string"}, refuse: false,
			unchecked: "VelaUX's policy forms take no expressions, and a save leaves a policy's to admission"},
		{name: "surface each in a trait", value: "$(each.index)", spec: inTrait("num"), path: pTraitN,
			req: apisv1.ExpressionCheckRequest{Surface: "trait", Component: "reader", Kind: "integer"}, refuse: true},
	}
}

// stepScopeOf is where a workflow step's value sits, as the studio sends it:
// the workflow's steps as it runs them, and the loop the value is in. A
// top-level step's own if is decided before its loop, so it is no loop body.
func stepScopeOf(wf *v1beta1.Workflow, name string, cond bool) apisv1.ExpressionStep {
	scope := apisv1.ExpressionStep{Step: name, Condition: cond, Steps: []apisv1.ExpressionStepOutputs{}}
	if wf.Mode != nil {
		scope.Mode, scope.SubMode = string(wf.Mode.Steps), string(wf.Mode.SubSteps)
	}
	declared := func(b wfv1alpha1.WorkflowStepBase) apisv1.ExpressionStepOutputs {
		o := apisv1.ExpressionStepOutputs{Name: b.Name, DependsOn: b.DependsOn}
		for _, out := range b.Outputs {
			o.Outputs = append(o.Outputs, out.Name)
		}
		return o
	}
	for _, s := range wf.Steps {
		o := declared(s.WorkflowStepBase)
		o.ForEach = s.ForEach != nil
		o.Mode = string(s.Mode)
		inGroup := false
		for _, sub := range s.SubSteps {
			o.SubSteps = append(o.SubSteps, declared(sub))
			inGroup = inGroup || sub.Name == name
		}
		scope.Steps = append(scope.Steps, o)
		own := s.Name == name && len(s.SubSteps) == 0 && !cond
		if s.ForEach != nil && (own || inGroup) {
			scope.LoopBody = true
			if s.ForEach.Items != nil {
				scope.ForEachItems = json.RawMessage(s.ForEach.Items.Raw)
			}
		}
	}
	return scope
}

// celError is where cel-go reports a compile error, which admission passes on
// whole: the message is what the editor shows, beside the expression.
var celError = regexp.MustCompile(`ERROR: <input>:\d+:\d+: ([^\n]*)\n \| [^\n]*\n \| [ .]*\^`)

// shippedComponent is a ComponentDefinition KubeVela ships, read from the module
// the tests build against, so a case reads what the release applies.
func shippedComponent(t *testing.T, name string) client.Object {
	t.Helper()
	file, _ := goruntime.FuncForPC(reflect.ValueOf(appfile.ValidateComponentReads).Pointer()).FileLine(0)
	root := filepath.Dir(filepath.Dir(filepath.Dir(file)))
	raw, err := os.ReadFile(filepath.Join(root, "charts", "vela-core", "definitions", name+".yaml"))
	require.NoError(t, err)
	var kept []string
	for _, line := range strings.Split(string(raw), "\n") {
		if !strings.Contains(line, "{{") {
			kept = append(kept, line)
		}
	}
	def := &v1beta1.ComponentDefinition{}
	require.NoError(t, yaml.Unmarshal([]byte(strings.Join(kept, "\n")), def))
	def.Namespace = velaNS
	return def
}

func TestExpressionEquivalence(t *testing.T) {
	require.NoError(t, utilfeature.DefaultMutableFeatureGate.SetFromMap(map[string]bool{string(features.EnableCelExpressions): true}))
	for _, tc := range eqCases() {
		t.Run(tc.name, func(t *testing.T) {
			expr := tc.value
			spec := tc.spec()
			raw, err := json.Marshal(spec)
			require.NoError(t, err)
			quoted, _ := json.Marshal(expr)
			raw = []byte(strings.ReplaceAll(string(raw), `"`+value+`"`, string(quoted)))
			require.NoError(t, json.Unmarshal(raw, &spec))
			annotations := map[string]string{oam.AnnotationCelExpressions: "true"}
			app := &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{Name: "shop", Namespace: eqNS, Annotations: annotations}, Spec: spec}

			objs := append(eqDefinitions(), app.DeepCopy())
			if tc.defs != nil {
				objs = append(objs, tc.defs(t)...)
			}
			cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(objs...).Build()

			// Admission.
			h := &appwebhook.ValidatingHandler{Client: cli}
			errs := append(h.ValidateSources(context.Background(), app), h.ValidateWorkflow(context.Background(), app)...)
			var admitted []string
			var elsewhere field.ErrorList
			for _, e := range errs {
				if e.Field == tc.path || strings.HasPrefix(tc.path, e.Field+".") || strings.HasPrefix(tc.path, e.Field+"[") {
					admitted = append(admitted, celError.ReplaceAllString(e.Detail, "$1"))
				} else {
					elsewhere = append(elsewhere, e)
				}
			}
			assert.Empty(t, elsewhere, "admission reports nothing about other fields")

			// VelaUX.
			svc := &expressionServiceImpl{enabled: true, KubeClient: cli, EnvBindingService: oneEnv{namespace: eqNS, name: "shop"}}
			uxApp := &model.Application{Name: "shop", Annotations: annotations, Sources: spec.Sources}
			req := tc.req
			req.Value = expr
			if tc.step != "" {
				req.ExpressionStep = stepScopeOf(spec.Workflow, tc.step, tc.cond)
			}
			got, err := svc.Check(context.Background(), uxApp, req)
			if tc.unchecked != "" {
				assert.ErrorIs(t, err, bcode.ErrExpressionSurface, "VelaUX does not check this surface: %s", tc.unchecked)
				t.Logf("admission: %q (VelaUX does not check it: %s)", admitted, tc.unchecked)
				assert.Equal(t, tc.refuse, len(admitted) > 0, "admission")
				return
			}
			require.NoError(t, err)
			var ux []string
			for _, i := range got.Issues {
				if !i.Warning {
					ux = append(ux, i.Message)
				}
			}

			report := fmt.Sprintf("admission: %q\nvelaux: %q", admitted, ux)
			if tc.once {
				assert.Len(t, admitted, 1, "admission reports it once\n%s", report)
				assert.Len(t, ux, 1, "VelaUX reports it once\n%s", report)
			}
			t.Log(report)
			assert.Equal(t, tc.refuse, len(admitted) > 0, "admission\n%s", report)
			assert.Equal(t, tc.refuse, len(ux) > 0, "velaux\n%s", report)
			if !tc.refuse || len(admitted) == 0 || len(ux) == 0 {
				return
			}
			if tc.wording == mismatchWording {
				a := admissionMismatch.FindStringSubmatch(admitted[len(admitted)-1])
				if b := admissionInputMismatch.FindStringSubmatch(admitted[len(admitted)-1]); b != nil {
					a = []string{b[0], b[2], b[1]}
				}
				u := velauxMismatch.FindStringSubmatch(ux[len(ux)-1])
				require.NotNil(t, a, "admission reports a type mismatch\n%s", report)
				require.NotNil(t, u, "VelaUX reports a type mismatch\n%s", report)
				assert.Equal(t, a[1:], u[1:], "both name the same type found and wanted\n%s", report)
				return
			}
			if tc.wording != "" {
				require.NotEmpty(t, tc.shared, "a differing wording names what both still say")
				for _, msgs := range [][]string{admitted, ux} {
					assert.Contains(t, strings.Join(msgs, "\n"), tc.shared, "both say %q: %s\n%s", tc.shared, tc.wording, report)
				}
				return
			}
			carried := false
			for _, a := range admitted {
				for _, u := range ux {
					carried = carried || strings.Contains(u, a)
				}
			}
			assert.True(t, carried, "VelaUX's message carries admission's\n%s", report)
		})
	}
}
