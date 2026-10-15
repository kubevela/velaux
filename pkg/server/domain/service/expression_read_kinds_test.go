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

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// typedReadsService is an application deployed to prod whose components are
// typed by their definitions: db writes a string host and an int port; api is a
// webservice with a trait that patches its workload; web adds an ingress through
// a trait; edge adds the same ingress and patches its resources; pinned is db's
// type at revision v1, which writes an int host; local is a type defined only in
// prod. Its sources: geo pins atlas at v1, and cfg reads settings, which prod
// defines over vela-system's.
func typedReadsService(t *testing.T) *expressionServiceImpl {
	t.Helper()
	app := &v1beta1.Application{
		ObjectMeta: metav1.ObjectMeta{Name: "shop", Namespace: "prod"},
		Spec: v1beta1.ApplicationSpec{
			Components: []common.ApplicationComponent{
				{Name: "reader", Type: "webservice"},
				{Name: "db", Type: "database"},
				{Name: "api", Type: "webservice", Traits: []common.ApplicationTrait{{Type: "scaler"}}},
				{Name: "web", Type: "webservice", Traits: []common.ApplicationTrait{{Type: "gateway"}}},
				{Name: "edge", Type: "webservice", Traits: []common.ApplicationTrait{{Type: "gateway"}, {Type: "labeller"}}},
				{Name: "pinned", Type: "database@v1"},
				{Name: "local", Type: "cache"},
			},
			Sources: []v1beta1.ApplicationSource{{Name: "cfg", Type: "settings"}},
		},
	}
	database := cueComponentDefinition("database", velaNS, `
parameter: {host: *"db" | string, port: *5432 | int}
output: {apiVersion: "v1", kind: "ConfigMap", data: {host: parameter.host, port: parameter.port}}
`)
	databaseV1 := cueComponentDefinition("database", velaNS, `
parameter: {host: *1 | int}
output: {apiVersion: "v1", kind: "ConfigMap", data: host: parameter.host}
`)
	atlasV1 := sourceDefinition("atlas", velaNS, "region: string")
	objs := []client.Object{app, database,
		cueComponentDefinition("webservice", velaNS, `
parameter: {replicas: *1 | int}
output: {apiVersion: "apps/v1", kind: "Deployment", spec: replicas: parameter.replicas}
`),
		cueComponentDefinition("cache", "prod", `
parameter: {size: *1 | int}
output: {apiVersion: "v1", kind: "ConfigMap", data: size: parameter.size}
`),
		&v1beta1.DefinitionRevision{
			ObjectMeta: metav1.ObjectMeta{Name: "database-v1", Namespace: velaNS},
			Spec:       v1beta1.DefinitionRevisionSpec{Revision: 1, DefinitionType: common.ComponentType, ComponentDefinition: *databaseV1},
		},
		traitDefinition("scaler", "parameter: replicas: *1 | int\npatch: spec: replicas: parameter.replicas\n"),
		traitDefinition("gateway", "parameter: port: *80 | int\noutputs: ingress: {apiVersion: \"v1\", kind: \"Ingress\", spec: port: parameter.port}\n"),
		traitDefinition("labeller", "parameter: {}\npatchOutputs: ingress: metadata: labels: team: \"shop\"\n"),
		sourceDefinition("atlas", velaNS, "region: int"),
		&v1beta1.DefinitionRevision{
			ObjectMeta: metav1.ObjectMeta{Name: "atlas-v1", Namespace: velaNS},
			Spec:       v1beta1.DefinitionRevisionSpec{Revision: 1, DefinitionType: common.SourceType, SourceDefinition: *atlasV1},
		},
		sourceDefinition("settings", velaNS, "port: string"),
		sourceDefinition("settings", "prod", "port: int"),
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(objs...).Build()
	return &expressionServiceImpl{enabled: true, KubeClient: cli, EnvBindingService: oneEnv{namespace: "prod", name: "shop"}}
}

const velaNS = "vela-system"

func cueComponentDefinition(name, namespace, tmpl string) *v1beta1.ComponentDefinition {
	return &v1beta1.ComponentDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
		Spec:       v1beta1.ComponentDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: tmpl}}},
	}
}

func traitDefinition(name, tmpl string) *v1beta1.TraitDefinition {
	return &v1beta1.TraitDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: velaNS},
		Spec:       v1beta1.TraitDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: tmpl}}},
	}
}

func sourceDefinition(name, namespace, schemaBody string) *v1beta1.SourceDefinition {
	return &v1beta1.SourceDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
		Spec: v1beta1.SourceDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{
			Template: "parameter: {}\nschema: {" + schemaBody + "}\noutput: {}\n"}}},
	}
}

// A value that is one component read takes the type its producer declares, and
// is checked against the parameter as a source read is.
func TestExpressionCheckTypesComponentReads(t *testing.T) {
	svc := typedReadsService(t)
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"}}
	check := func(value, kind string) (string, []string) {
		t.Helper()
		got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "component", Component: "reader", Value: value, Kind: kind})
		require.NoError(t, err)
		var errs []string
		for _, i := range got.Issues {
			if !i.Warning {
				errs = append(errs, i.Message)
			}
		}
		return got.Type, errs
	}

	typ, errs := check("$(component.db.output.data.host)", "integer")
	assert.Equal(t, "string", typ)
	assert.Equal(t, []string{"this value is string, but the parameter expects int"}, errs, "a string field cannot fill an int parameter")

	typ, errs = check(`$(component.db.cluster("east").output.data.host)`, "integer")
	assert.Equal(t, "string", typ, "a placement does not change what is read")
	assert.Len(t, errs, 1)

	typ, errs = check("$(component.db.output.data.port)", "integer")
	assert.Equal(t, "int", typ)
	assert.Empty(t, errs, "an int field fills an int parameter")

	typ, errs = check("$(component.db.output.data.timeout)", "integer")
	assert.Equal(t, "dyn", typ)
	assert.Empty(t, errs, "a field the template does not write fits anything")

	typ, errs = check("$(component.db.output.status.ready)", "integer")
	assert.Equal(t, "dyn", typ)
	assert.Empty(t, errs, "the status is the controller's, so it fits anything")

	typ, errs = check("$(component.api.output.kind)", "integer")
	assert.Equal(t, "dyn", typ, "a trait that patches the workload leaves it untyped")
	assert.Empty(t, errs)

	typ, errs = check("$(component.web.output.kind)", "integer")
	assert.Equal(t, "string", typ, "a trait that patches nothing leaves the workload typed")
	assert.Len(t, errs, 1)

	typ, errs = check("$(component.web.outputs.ingress.spec.port)", "string")
	assert.Equal(t, "int", typ, "a resource a trait adds is typed by the trait")
	assert.Equal(t, []string{"this value is int, but the parameter expects string"}, errs)

	typ, errs = check("$(component.edge.outputs.ingress.spec.port)", "string")
	assert.Equal(t, "dyn", typ, "a trait that patches the resources leaves them untyped")
	assert.Empty(t, errs)

	typ, errs = check("$(component.pinned.output.data.host)", "string")
	assert.Equal(t, "int", typ, "a type@v1 revision decides the type, not the latest definition")
	assert.Len(t, errs, 1)

	typ, errs = check("$(component.local.output.data.size)", "string")
	assert.Equal(t, "int", typ, "a definition in the application's namespace is found")
	assert.Len(t, errs, 1)

	typ, errs = check("port-$(component.db.output.data.port)", "integer")
	assert.Equal(t, "string", typ, "interpolated text is a string")
	assert.Equal(t, []string{"this value is string, but the parameter expects int"}, errs)

	typ, errs = check("$(int(component.db.output.data.host))", "integer")
	assert.Equal(t, "int", typ, "an expression doing more than reading keeps its own type")
	assert.Empty(t, errs)
}

// A source is typed by the definition admission reads: a pinned source by its
// revision, and one the application's namespace defines over vela-system's.
func TestExpressionCheckTypesSourcesAsAdmission(t *testing.T) {
	svc := typedReadsService(t)
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"},
		Sources: []v1beta1.ApplicationSource{{Name: "geo", Type: "atlas@v1"}}}
	check := func(value, kind string) *apisv1.ExpressionCheckResponse {
		t.Helper()
		got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "component", Component: "reader", Value: value, Kind: kind})
		require.NoError(t, err)
		return got
	}

	got := check("$(source.geo.region)", "integer")
	assert.Equal(t, "string", got.Type, "atlas@v1 is typed by that revision's schema")
	require.Len(t, got.Issues, 1)
	assert.Equal(t, "this value is string, but the parameter expects int", got.Issues[0].Message)

	got = check("$(source.cfg.port)", "integer")
	assert.Equal(t, "int", got.Type, "the deployed Application's namespace shadows vela-system")
	assert.Empty(t, got.Issues)
}

// A dyn value is not checked against the parameter: it warns, and the warning
// says so rather than claiming the webhook refuses it.
func TestExpressionCheckDynWarns(t *testing.T) {
	svc := typedReadsService(t)
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"}}
	got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{
		Surface: "component", Component: "reader", Value: "$(component.db.output.status.ready)", Kind: "integer",
	})
	require.NoError(t, err)
	require.Len(t, got.Issues, 1)
	assert.True(t, got.Issues[0].Warning)
	assert.Equal(t, "the type of this value is not known, so it is not checked here and a wrong one fails at render; convert it to check it, for example int(...)", got.Issues[0].Message)
}
