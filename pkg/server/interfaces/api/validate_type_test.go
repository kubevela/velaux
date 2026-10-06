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

func TestValidatePinnedType(t *testing.T) {
	for typ, ok := range map[string]bool{
		"webapp":         true,
		"webapp@v2":      true,
		"webapp@v1.1.0":  true,
		"webapp@latest":  false,
		"webapp@":        false,
		"@v2":            false,
		"Web App":        false,
		"webapp@v1@v2":   false,
		"aws-s3@v1.0.0":  true,
		"cpuscaler@v10":  true,
		"webapp@v1.1.0-": false,
	} {
		component := apisv1.CreateComponentRequest{Name: "web", ComponentType: typ}
		assert.Equal(t, ok, validate.Struct(&component) == nil, "component %q", typ)
		trait := apisv1.CreateApplicationTraitRequest{Type: typ}
		assert.Equal(t, ok, validate.Struct(&trait) == nil, "trait %q", typ)
		policy := apisv1.CreatePolicyRequest{Name: "p1", Type: typ}
		assert.Equal(t, ok, validate.Struct(&policy) == nil, "policy %q", typ)
		source := apisv1.CreateSourceRequest{Name: "src", Type: typ}
		assert.Equal(t, ok, validate.Struct(&source) == nil, "source %q", typ)
	}
}
