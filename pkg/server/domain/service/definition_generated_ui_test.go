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
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	pkgaddon "github.com/oam-dev/kubevela/pkg/addon"
	"github.com/oam-dev/kubevela/pkg/config"
	"github.com/oam-dev/kubevela/pkg/cue/script"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/oam-dev/kubevela/pkg/utils/schema"
)

func TestGeneratedUISchema(t *testing.T) {
	cm := v1.ConfigMap{Data: map[string]string{
		types.DefaultUISchema: `[{"jsonKey":"key","uiType":"Input","conditions":[{"jsonKey":"type","value":"something"}]}]`,
	}}
	ui := generatedUISchema(cm)
	if assert.Len(t, ui, 1) {
		assert.Equal(t, "type", ui[0].Conditions[0].JSONKey)
	}

	assert.Nil(t, generatedUISchema(v1.ConfigMap{}), "a controller that writes none leaves VelaUX to derive the form")
	assert.Nil(t, generatedUISchema(v1.ConfigMap{Data: map[string]string{types.DefaultUISchema: "not json"}}))
}

func TestAddonDefaultUISchema(t *testing.T) {
	generated := []*schema.UIParameter{{JSONKey: "port", Conditions: []schema.Condition{{JSONKey: "tls", Op: "!=", Value: nil}}}}
	assert.Equal(t, generated, addonDefaultUISchema(&pkgaddon.UIData{DefaultUISchema: generated}))

	derived := addonDefaultUISchema(&pkgaddon.UIData{APISchema: &openapi3.Schema{
		Properties: openapi3.Schemas{"image": openapi3.NewSchemaRef("", openapi3.NewStringSchema())},
	}})
	if assert.Len(t, derived, 1) {
		assert.Equal(t, "image", derived[0].JSONKey)
	}
}

func TestConfigTemplateUISchema(t *testing.T) {
	tmpl := &config.Template{Template: script.CUE(`
metadata: name: "demo"
template: parameter: {
	kind: "token" | "basic"
	if kind == "token" { token: string }
	if kind == "basic" { user: string, password: string }
}
`)}
	ui := configTemplateUISchema(context.Background(), tmpl)
	var keys []string
	for _, p := range ui {
		keys = append(keys, p.JSONKey)
	}
	assert.Equal(t, []string{"kind", "token", "user", "password"}, keys)
	assert.Equal(t, "token", ui[1].Conditions[0].Value)
}

func TestDetailSourceDefinition(t *testing.T) {
	def := &v1beta1.SourceDefinition{
		TypeMeta:   metav1.TypeMeta{APIVersion: "core.oam.dev/v1beta1", Kind: "SourceDefinition"},
		ObjectMeta: metav1.ObjectMeta{Name: "db", Namespace: types.DefaultKubeVelaNS, Annotations: map[string]string{types.AnnoDefinitionDescription: "A database"}},
		Spec:       v1beta1.SourceDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: "parameter: secret: string\nschema: host: string"}}},
	}
	cm := &v1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "source-schema-db", Namespace: types.DefaultKubeVelaNS},
		Data: map[string]string{
			types.OpenapiV3JSONSchema: `{"type":"object","properties":{"secret":{"type":"string"}},"required":["secret"]}`,
			types.DefaultUISchema:     `[{"jsonKey":"secret","uiType":"Input"}]`,
			types.SourceOutputSchema:  `{"type":"object","properties":{"host":{"type":"string"}}}`,
		},
	}
	svc := &definitionServiceImpl{KubeClient: fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(def, cm).Build()}

	detail, err := svc.DetailDefinition(context.Background(), "db", "source")
	require.NoError(t, err)
	assert.Equal(t, "A database", detail.Description)
	assert.NotNil(t, detail.Source, "the definition's spec is returned like the other kinds'")
	assert.Contains(t, detail.APISchema.Properties, "secret")
	if assert.Len(t, detail.UISchema, 1) {
		assert.Equal(t, "secret", detail.UISchema[0].JSONKey)
	}
	if assert.NotNil(t, detail.OutputSchema) {
		assert.Contains(t, detail.OutputSchema.Properties, "host")
	}

	list, err := svc.ListDefinitions(context.Background(), DefinitionQueryOption{Type: "source"})
	require.NoError(t, err)
	if assert.Len(t, list, 1) {
		assert.Equal(t, "db", list[0].Name)
	}
}
