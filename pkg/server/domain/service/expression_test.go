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
	env, err := (&expressionServiceImpl{enabled: true}).Env(context.Background(), app, "trait")
	require.NoError(t, err)
	assert.True(t, env.OptedIn)
	require.Len(t, env.Variables, 2)
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

	off, err := (&expressionServiceImpl{}).Env(context.Background(), app, "component")
	require.NoError(t, err)
	assert.False(t, off.Enabled)
	assert.Empty(t, off.Variables)

	_, err = (&expressionServiceImpl{enabled: true}).Env(context.Background(), app, "nowhere")
	assert.Error(t, err)
}
