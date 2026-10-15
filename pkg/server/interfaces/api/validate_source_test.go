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

package api

import (
	"testing"

	"github.com/stretchr/testify/assert"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// A source name is read as $(source.<name>), so it has to be a CEL identifier.
func TestValidateSourceName(t *testing.T) {
	for name, ok := range map[string]bool{
		"clusterInfo":  true,
		"catalog":      true,
		"db_primary":   true,
		"cluster-info": false,
		"1cluster":     false,
		"":             false,
		"a.b":          false,
	} {
		err := validate.Struct(&apisv1.CreateSourceRequest{Name: name, Type: "cluster-info"})
		assert.Equal(t, ok, err == nil, name)
	}
}
