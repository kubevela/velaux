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

// As KubeVela writes the storage trait's emptyDir medium (`*"" | "Memory"`), plus an
// empty choice that is not the default.
const emptyEnumParameterSchema = `{
  "type": "object",
  "properties": {
    "medium": {"type": "string", "title": "medium", "default": "", "enum": ["", "Memory"]},
    "policy": {"type": "string", "title": "policy", "default": "always", "enum": ["always", ""]}
  }
}`

func TestRenderDefaultUISchemaEmptyEnumLabel(t *testing.T) {
	var apiSchema openapi3.Schema
	require.NoError(t, apiSchema.UnmarshalJSON([]byte(emptyEnumParameterSchema)))

	options := map[string][]schema.Option{}
	for _, p := range renderDefaultUISchema(&apiSchema) {
		options[p.JSONKey] = p.Validate.Options
	}
	assert.Equal(t, []schema.Option{{Label: "Default", Value: ""}, {Label: "Memory", Value: "Memory"}}, options["medium"])
	assert.Equal(t, []schema.Option{{Label: "Always", Value: "always"}, {Label: "(empty)", Value: ""}}, options["policy"])
}
