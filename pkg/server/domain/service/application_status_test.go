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
	"encoding/json"
	"testing"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

func application(t *testing.T, doc string) *unstructured.Unstructured {
	t.Helper()
	// Decoded as the API client decodes it, so numbers are int64.
	obj := &unstructured.Unstructured{}
	require.NoError(t, obj.UnmarshalJSON([]byte(doc)))
	return obj
}

// The component dependencies are passed through as the Application reports
// them, beside the status VelaUX decodes into KubeVela's types.
func TestApplicationStatusFromCarriesDependencies(t *testing.T) {
	status, err := applicationStatusFrom(application(t, `{
		"apiVersion": "core.oam.dev/v1beta1", "kind": "Application",
		"metadata": {"name": "shop", "generation": 2},
		"status": {
			"status": "running", "observedGeneration": 2,
			"services": [{"name": "api", "healthy": true}],
			"dependencies": [
				{"component": "api", "dependsOn": "cfg", "source": "dependsOn"},
				{"component": "api", "dependsOn": "db", "source": "expression"},
				{"component": "api", "dependsOn": "flags", "source": "expression", "cluster": "east"}
			]
		}}`))
	require.NoError(t, err)
	require.Equal(t, common.ApplicationRunning, status.Phase)
	require.Len(t, status.Services, 1)
	require.Equal(t, []apisv1.ComponentDependency{
		{Component: "api", DependsOn: "cfg", Source: "dependsOn"},
		{Component: "api", DependsOn: "db", Source: "expression"},
		{Component: "api", DependsOn: "flags", Source: "expression", Cluster: "east"},
	}, status.Dependencies)

	out, err := json.Marshal(status)
	require.NoError(t, err)
	require.Contains(t, string(out), `"status":"running"`, "KubeVela's fields stay at the top of the status")
	require.Contains(t, string(out), `"dependencies":[{"component":"api"`)
}

func TestApplicationStatusFromAdjustsThePhase(t *testing.T) {
	status, err := applicationStatusFrom(application(t, `{
		"apiVersion": "core.oam.dev/v1beta1", "kind": "Application",
		"metadata": {"name": "shop", "generation": 3},
		"status": {"status": "running", "observedGeneration": 2}}`))
	require.NoError(t, err)
	require.Equal(t, common.ApplicationStarting, status.Phase, "a spec the controller has not seen yet is starting")
	require.Empty(t, status.Dependencies, "an Application without dependencies, or from a KubeVela that predates them")

	status, err = applicationStatusFrom(application(t, `{
		"apiVersion": "core.oam.dev/v1beta1", "kind": "Application",
		"metadata": {"name": "shop", "deletionTimestamp": "2026-09-28T10:00:00Z"},
		"status": {"status": "running"}}`))
	require.NoError(t, err)
	require.Equal(t, common.ApplicationDeleting, status.Phase)
}

// A malformed optional field is skipped rather than failing the status, which
// would fail every environment listed with it; with no spec, there is nothing to
// derive in its place.
func TestApplicationStatusFromSkipsMalformedDependencies(t *testing.T) {
	status, err := applicationStatusFrom(application(t, `{
		"apiVersion": "core.oam.dev/v1beta1", "kind": "Application",
		"metadata": {"name": "shop", "generation": 1},
		"status": {"status": "running", "observedGeneration": 1, "dependencies": "not a list"}}`))
	require.NoError(t, err)
	require.Equal(t, common.ApplicationRunning, status.Phase)
	require.Empty(t, status.Dependencies)
}

// A client decoding the response reaches KubeVela's fields whatever the status
// holds: they are part of ApplicationStatus, not behind a pointer that stays nil.
func TestApplicationStatusResponseDecodes(t *testing.T) {
	for _, body := range []string{`{"status":{}}`, `{"status":{"dependencies":[{"component":"api","dependsOn":"db","source":"expression"}]}}`} {
		var got apisv1.ApplicationStatusResponse
		require.NoError(t, json.Unmarshal([]byte(body), &got))
		require.NotPanics(t, func() { _ = got.Status.Phase }, body)
	}
	var got apisv1.ApplicationStatusResponse
	require.NoError(t, json.Unmarshal([]byte(`{"status":{"status":"running","dependencies":[{"component":"api","dependsOn":"db","source":"expression"}]}}`), &got))
	require.Equal(t, common.ApplicationRunning, got.Status.Phase)
	require.Len(t, got.Status.Dependencies, 1)
}

// Without status.dependencies (a KubeVela that does not write it, or an
// Application with none, which KubeVela leaves out), the dependencies come from
// the deployed spec, so nothing shown is a draft never deployed.
func TestApplicationStatusFromDerivesDependenciesFromTheDeployedSpec(t *testing.T) {
	const spec = `"spec": {"components": [
		{"name": "db", "outputs": [{"name": "db-host", "valueFrom": "output.status.endpoint"}]},
		{"name": "cfg"},
		{"name": "api", "dependsOn": ["cfg"], "inputs": [{"from": "db-host", "parameterKey": "host"}]}
	]}`
	for name, status := range map[string]string{
		"no dependencies reported":         `{"status": "running"}`,
		"dependencies that are not a list": `{"status": "running", "dependencies": "not a list"}`,
	} {
		t.Run(name, func(t *testing.T) {
			got, err := applicationStatusFrom(application(t, `{"apiVersion": "core.oam.dev/v1beta1", "kind": "Application",
				"metadata": {"name": "shop"}, `+spec+`, "status": `+status+`}`))
			require.NoError(t, err)
			require.Equal(t, []apisv1.ComponentDependency{
				{Component: "api", DependsOn: "cfg", Source: "dependsOn"},
				{Component: "api", DependsOn: "db", Source: "inputs"},
			}, got.Dependencies)
		})
	}

	t.Run("reported dependencies are used as they are", func(t *testing.T) {
		got, err := applicationStatusFrom(application(t, `{"apiVersion": "core.oam.dev/v1beta1", "kind": "Application",
			"metadata": {"name": "shop"}, `+spec+`, "status": {"dependencies": [{"component": "api", "dependsOn": "db", "source": "expression"}]}}`))
		require.NoError(t, err)
		require.Equal(t, []apisv1.ComponentDependency{{Component: "api", DependsOn: "db", Source: "expression"}}, got.Dependencies)
	})
}
