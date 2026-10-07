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
	"testing"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRenderDefaultUISchemaUntyped covers the schemas CUE emits for an open
// value: `{...}`, `[string]: _` and `[..._]` leave the type unset.
func TestRenderDefaultUISchemaUntyped(t *testing.T) {
	untyped := &openapi3.Schema{}
	labels := openapi3.NewObjectSchema()
	labels.AdditionalProperties = openapi3.AdditionalProperties{Schema: untyped.NewRef()}
	items := openapi3.NewArraySchema()
	items.Items = untyped.NewRef()
	apiSchema := openapi3.NewObjectSchema().
		WithProperty("labels", labels).
		WithProperty("items", items).
		WithProperty("anything", untyped)

	var params map[string]string
	require.NotPanics(t, func() {
		params = map[string]string{}
		for _, p := range renderDefaultUISchema(apiSchema) {
			params[p.JSONKey] = p.UIType
		}
	})
	assert.Equal(t, map[string]string{"labels": "KV", "items": "Structs", "anything": "Input"}, params)
}
