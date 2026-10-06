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

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

func TestExpressionCheck(t *testing.T) {
	svc := &expressionServiceImpl{enabled: true}
	app := &model.Application{Name: "demo"}
	cases := map[string]struct {
		value, kind string
		wantType    string
		wantIssue   string
		issueStart  int
	}{
		"a whole expression keeps its type":     {value: "$(context.appRevisionNum)", kind: "integer", wantType: "int"},
		"an int feeds a number":                 {value: "$(context.appRevisionNum)", kind: "number", wantType: "int"},
		"text around an expression is a string": {value: "http://$(context.appName):80", kind: "string", wantType: "string"},
		"a string does not feed an int": {value: "$(context.appName)", kind: "integer", wantType: "string",
			wantIssue: "this value is string, but the parameter expects int"},
		"an undeclared read is placed in the value": {value: "x-$(context.nope)", kind: "string",
			wantIssue: "undefined field 'nope'", issueStart: 12},
		"an unclosed expression":            {value: "$(context.appName", kind: "string", wantIssue: "unterminated"},
		"no expression is a literal string": {value: "plain", kind: "string", wantType: "string"},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "component", Value: tc.value, Kind: tc.kind})
			require.NoError(t, err)
			if tc.wantType != "" {
				assert.Equal(t, tc.wantType, got.Type)
			}
			if tc.wantIssue == "" {
				assert.Empty(t, got.Issues)
				return
			}
			require.NotEmpty(t, got.Issues)
			assert.Contains(t, got.Issues[0].Message, tc.wantIssue)
			if tc.issueStart > 0 {
				assert.Equal(t, tc.issueStart, got.Issues[0].Start)
			}
		})
	}
}

func TestExpressionEnv(t *testing.T) {
	app := &model.Application{Name: "demo", Annotations: map[string]string{"app.oam.dev/cel-expressions": "true"}}
	env, err := (&expressionServiceImpl{enabled: true}).Env(context.Background(), app, "trait", "", "")
	require.NoError(t, err)
	assert.True(t, env.OptedIn)
	require.Len(t, env.Variables, 3)
	assert.Equal(t, "component", env.Variables[2].Name, "a component or trait reads the other components")
	ctxRoot := env.Variables[0]
	assert.Equal(t, "context", ctxRoot.Name)
	fields := map[string]*apisv1.ExpressionVariable{}
	for _, f := range ctxRoot.Children {
		fields[f.Name] = f
	}
	require.Contains(t, fields, "traitType", "a trait reads its own type")
	assert.Equal(t, "string", fields["appName"].Type)
	assert.Equal(t, "string", fields["appName"].Schema)
	assert.Contains(t, fields["clusterVersion"].Schema, "minor")
	assert.NotContains(t, fields["clusterVersion"].Schema, "_#def")
	assert.NotEmpty(t, fields["appName"].Description)
	require.Contains(t, fields, "clusterVersion")
	assert.NotEmpty(t, fields["clusterVersion"].Children)

	off, err := (&expressionServiceImpl{}).Env(context.Background(), app, "component", "", "")
	require.NoError(t, err)
	assert.False(t, off.Enabled)
	assert.Empty(t, off.Variables)

	_, err = (&expressionServiceImpl{enabled: true}).Env(context.Background(), app, "nowhere", "", "")
	assert.Error(t, err)
}

func TestExpressionEnvReadsAuthoredSources(t *testing.T) {
	def := &v1beta1.SourceDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: "db-lookup", Namespace: types.DefaultKubeVelaNS},
		Spec: v1beta1.SourceDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: `
parameter: secret: string
schema: {
	host: string
	port: int
}
output: host: "db"
`}}},
	}
	svc := &expressionServiceImpl{enabled: true, KubeClient: fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(def).Build()}
	app := &model.Application{
		Name:        "demo",
		Annotations: map[string]string{"app.oam.dev/cel-expressions": "true"},
		Sources:     []v1beta1.ApplicationSource{{Name: "db", Type: "db-lookup"}},
	}

	env, err := svc.Env(context.Background(), app, "component", "", "")
	require.NoError(t, err)
	require.Len(t, env.Variables, 3)
	assert.Equal(t, "component", env.Variables[2].Name, "a component or trait reads the other components")
	sources := env.Variables[1]
	require.Len(t, sources.Children, 1, "a source counts before the application is deployed")
	db := sources.Children[0]
	assert.Equal(t, "db", db.Name)
	var fields []string
	for _, f := range db.Children {
		fields = append(fields, f.Name+":"+f.Type)
	}
	assert.Equal(t, []string{"host:string", "port:int"}, fields)

	got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "component", Value: "$(source.db.port)", Kind: "integer"})
	require.NoError(t, err)
	assert.Empty(t, got.Issues)
	assert.Equal(t, "int", got.Type)
}

func TestExpressionEnvChainsSources(t *testing.T) {
	def := &v1beta1.SourceDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: "lookup", Namespace: types.DefaultKubeVelaNS},
		Spec: v1beta1.SourceDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: `
parameter: key: string
schema: value: string
output: value: parameter.key
`}}},
	}
	svc := &expressionServiceImpl{enabled: true, KubeClient: fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(def).Build()}
	app := &model.Application{
		Name:        "demo",
		Annotations: map[string]string{"app.oam.dev/cel-expressions": "true"},
		Sources:     []v1beta1.ApplicationSource{{Name: "first", Type: "lookup"}, {Name: "second", Type: "lookup"}, {Name: "third", Type: "lookup"}},
	}
	readable := func(source string) []string {
		env, err := svc.Env(context.Background(), app, "source", source, "")
		require.NoError(t, err)
		require.Len(t, env.Variables, 2)
		var names []string
		for _, b := range env.Variables[1].Children {
			names = append(names, b.Name)
		}
		return names
	}
	assert.Equal(t, []string{"first"}, readable("second"), "a source reads only those declared before it")
	assert.Empty(t, readable("first"))
	assert.Equal(t, []string{"first", "second", "third"}, readable("new"), "a new source is declared last")

	env, err := svc.Env(context.Background(), app, "source", "second", "")
	require.NoError(t, err)
	assert.Equal(t, "context", env.Variables[0].Name, "a source reads the context a component does")

	got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "source", Source: "second", Value: "$(source.first.value)", Kind: "string"})
	require.NoError(t, err)
	assert.Empty(t, got.Issues)
	got, err = svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "source", Source: "second", Value: "$(source.third.value)", Kind: "string"})
	require.NoError(t, err)
	assert.NotEmpty(t, got.Issues, "a later source is not readable")
}
