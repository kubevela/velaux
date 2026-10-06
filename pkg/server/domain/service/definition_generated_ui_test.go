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
	v1 "k8s.io/api/core/v1"

	"github.com/oam-dev/kubevela/apis/types"
	pkgaddon "github.com/oam-dev/kubevela/pkg/addon"
	"github.com/oam-dev/kubevela/pkg/config"
	"github.com/oam-dev/kubevela/pkg/cue/script"
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
