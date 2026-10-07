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

	"github.com/oam-dev/kubevela/pkg/utils/schema"
)

// As KubeVela writes a definition's parameter schema: a +immutable field
// carries the x-immutable extension.
const immutableParameterSchema = `{
  "type": "object",
  "required": ["image"],
  "properties": {
    "image": {"type": "string", "title": "image"},
    "storageClass": {"type": "string", "title": "storageClass", "x-immutable": true},
    "volume": {
      "type": "object",
      "title": "volume",
      "properties": {
        "size": {"type": "string", "title": "size"},
        "claimName": {"type": "string", "title": "claimName", "x-immutable": true}
      }
    },
    "replicas": {"type": "integer", "title": "replicas", "x-immutable": false}
  }
}`

func TestRenderDefaultUISchemaImmutable(t *testing.T) {
	var apiSchema openapi3.Schema
	require.NoError(t, apiSchema.UnmarshalJSON([]byte(immutableParameterSchema)))

	params := map[string]*schema.UIParameter{}
	var collect func(ps []*schema.UIParameter, prefix string)
	collect = func(ps []*schema.UIParameter, prefix string) {
		for _, p := range ps {
			params[prefix+p.JSONKey] = p
			collect(p.SubParameters, prefix+p.JSONKey+".")
		}
	}
	collect(renderDefaultUISchema(&apiSchema), "")

	immutable := map[string]bool{}
	for key, p := range params {
		immutable[key] = p.Validate != nil && p.Validate.Immutable
	}
	assert.Equal(t, map[string]bool{
		"image":            false,
		"storageClass":     true,
		"volume":           false,
		"volume.size":      false,
		"volume.claimName": true,
		"replicas":         false,
	}, immutable)
}
