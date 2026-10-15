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

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// A source read is refused where admission refuses it, in its words.
func TestExpressionCheckSourceRules(t *testing.T) {
	def := func(name, tmpl string) *v1beta1.SourceDefinition {
		return &v1beta1.SourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: velaNS},
			Spec: v1beta1.SourceDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: tmpl}}}}
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(
		def("settings", "parameter: {}\nschema: {name: string, labels: [string]: string, maybe?: bool, any: _}\noutput: {}\n"),
		def("narrow", "consumableFrom: [\"workflowstep\"]\nparameter: {}\nschema: {name: string}\noutput: {}\n"),
	).Build()
	svc := &expressionServiceImpl{enabled: true, KubeClient: cli}
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"},
		Sources: []v1beta1.ApplicationSource{{Name: "cfg", Type: "settings"}, {Name: "only", Type: "narrow"}, {Name: "gone", Type: "nowhere"}}}
	check := func(surface, source, value string) []string {
		t.Helper()
		got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: surface, Source: source, Value: value})
		require.NoError(t, err)
		var errs []string
		for _, i := range got.Issues {
			if !i.Warning {
				errs = append(errs, i.Message)
			}
		}
		return errs
	}

	assert.Empty(t, check("component", "", "$(source.cfg.name)"))
	assert.Empty(t, check("component", "", "$(source.cfg.labels.team)"), "a key of an open map is declared")
	assert.Empty(t, check("component", "", "$(source.cfg.any.deep.down)"), "anything below a value of any type is")
	assert.Equal(t, []string{"source is not declared in spec.sources: nope"}, check("component", "", "$(source.nope.x)"))
	assert.Equal(t, []string{`path "nope" is not declared in schema of SourceDefinition "settings"`}, check("component", "", "$(source.cfg.nope)"))
	assert.Equal(t, []string{`failed to load SourceDefinition "nowhere": sourcedefinitions.core.oam.dev "nowhere" not found`},
		check("component", "", "$(source.gone.x)"))
	assert.Equal(t, []string{`SourceDefinition "narrow" declares consumableFrom [workflowstep] and cannot be consumed from a component`},
		check("component", "", "$(source.only.name)"))
	assert.Empty(t, check("workflowstep", "", "$(source.only.name)"))
	assert.Equal(t, []string{`source at index 0 can only depend on prior sources, but "only" is at index 1`},
		check("source", "cfg", "$(source.only.name)"), "a source reads only those declared before it")
}

// A read that may be absent is refused where it feeds a required parameter,
// unless has() guards it, as admission refuses it.
func TestExpressionCheckRequiredParameter(t *testing.T) {
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(&v1beta1.SourceDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: "settings", Namespace: velaNS},
		Spec: v1beta1.SourceDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{
			Template: "parameter: {}\nschema: {name: string, labels: [string]: string, maybe?: string}\noutput: {}\n"}}},
	}).Build()
	svc := &expressionServiceImpl{enabled: true, KubeClient: cli}
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"},
		Sources: []v1beta1.ApplicationSource{{Name: "cfg", Type: "settings"}}}
	check := func(value string, required bool) []string {
		t.Helper()
		got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "component", Value: value, Kind: "string", Required: required})
		require.NoError(t, err)
		var errs []string
		for _, i := range got.Issues {
			if !i.Warning {
				errs = append(errs, i.Message)
			}
		}
		return errs
	}
	assert.Equal(t, []string{"source.cfg.labels.team may be absent and feeds a required parameter; guard it with has(source.cfg.labels.team) ? source.cfg.labels.team : <fallback>"},
		check("$(source.cfg.labels.team)", true))
	assert.Len(t, check("$(source.cfg.maybe)", true), 1, "an optional field may be absent too")
	assert.Empty(t, check(`$(has(source.cfg.labels.team) ? source.cfg.labels.team : "none")`, true))
	assert.Empty(t, check("$(source.cfg.name)", true), "a declared field is always there")
	assert.Empty(t, check("$(source.cfg.labels.team)", false), "a parameter with a default may go unset")
}

// The properties a save checks know which parameters must be set.
func TestWalkExpressionsRequired(t *testing.T) {
	s := &openapi3.Schema{Type: &openapi3.Types{openapi3.TypeObject}, Required: []string{"must"},
		Properties: openapi3.Schemas{"must": openapi3.NewSchemaRef("", openapi3.NewStringSchema()), "may": openapi3.NewSchemaRef("", openapi3.NewStringSchema())}}
	got := map[string]bool{}
	require.NoError(t, walkExpressions("", map[string]interface{}{"must": "$(a)", "may": "$(b)"}, s, false,
		func(path, _ string, _ *openapi3.Schema, required bool) error {
			got[path] = required
			return nil
		}))
	assert.Equal(t, map[string]bool{"must": true, "may": false}, got)
}
