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

package loader

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/kubevela/velaux/pkg/plugin/types"
)

func TestValidateDefinitionPlugin(t *testing.T) {
	topology := types.DefinitionRef{Kind: types.DefinitionKindPolicy, Name: "topology"}
	cases := map[string]struct {
		data types.JSONData
		err  error
	}{
		"definition plugin naming a definition": {
			data: types.JSONData{ID: "topology-picker", Type: types.Definition, Definitions: []types.DefinitionRef{topology}},
		},
		"definition plugin naming nothing": {
			data: types.JSONData{ID: "topology-picker", Type: types.Definition},
			err:  ErrInvalidDefinitions,
		},
		"unknown definition kind": {
			data: types.JSONData{ID: "topology-picker", Type: types.Definition, Definitions: []types.DefinitionRef{{Kind: "workload", Name: "x"}}},
			err:  ErrInvalidDefinitions,
		},
		"definition without a name": {
			data: types.JSONData{ID: "topology-picker", Type: types.Definition, Definitions: []types.DefinitionRef{{Kind: types.DefinitionKindTrait}}},
			err:  ErrInvalidDefinitions,
		},
		"page plugin naming definitions": {
			data: types.JSONData{ID: "app-demo", Type: types.PageApp, Definitions: []types.DefinitionRef{topology}},
			err:  ErrInvalidDefinitions,
		},
	}
	for name, c := range cases {
		t.Run(name, func(t *testing.T) {
			err := validatePluginJSON(c.data)
			if c.err == nil {
				require.NoError(t, err)
				return
			}
			require.ErrorIs(t, err, c.err)
		})
	}
}
