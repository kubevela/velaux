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

package report

import (
	"context"
	"testing"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// fakeSource is a project with two apps, as a report sees it.
type fakeSource struct {
	listed []string
}

func (f *fakeSource) Apps(context.Context) ([]App, error) {
	return []App{{Name: "checkout", Alias: "Checkout"}, {Name: "payments"}}, nil
}

func (f *fakeSource) Components(context.Context) ([]Component, error) {
	return []Component{
		{App: "checkout", Component: "web", Kind: "component", Type: "webservice",
			Expressions: []Expression{{Property: "env", Expression: "$(source.db.host)"}}},
		{App: "checkout", Component: "web", Kind: "trait", Type: "scaler@v2"},
		{App: "payments", Component: "api", Kind: "component", Type: "webservice"},
	}, nil
}

func (f *fakeSource) Runs(context.Context) ([]WorkflowRun, error) {
	return []WorkflowRun{
		{App: "checkout", Env: "production", Workflow: "workflow-production", Name: "r1", Status: "failed", Finished: "2026-10-01T10:00:00Z",
			Steps: []RunStep{{Name: "deploy", Phase: "failed", Message: "boom"}}},
		{App: "checkout", Env: "production", Workflow: "workflow-production", Name: "r2", Status: "succeeded", Finished: "2026-10-02T10:00:00Z"},
		{App: "payments", Env: "production", Workflow: "workflow-production", Name: "r3", Status: "failed", Finished: "2026-10-02T11:00:00Z"},
	}, nil
}

func (f *fakeSource) Environments(context.Context) ([]Environment, error) {
	return []Environment{{App: "checkout", Env: "production", Revision: "v3", Edited: true}}, nil
}

func (f *fakeSource) Definitions(context.Context) ([]Definition, error) {
	return []Definition{{Name: "webservice", Kind: "component", Latest: "v3", Versions: []string{"v3", "v2"}}}, nil
}

func (f *fakeSource) List(_ context.Context, apiVersion, kind string) ([]Object, error) {
	f.listed = append(f.listed, apiVersion+"/"+kind)
	return []Object{{Cluster: "local", Namespace: "shop-prod", Object: map[string]interface{}{"metadata": map[string]interface{}{"name": "web"}}}}, nil
}

const failedRuns = `
// +title=Failed workflow runs
// +description=Runs that failed
// +chart=bar
// +chart:x=app
// +chart:title=Failed runs by application
import "vela/report"

template: {
	parameter: {
		// +usage=Include succeeded runs too
		all: *false | bool
	}
	runs: report.#Runs
	rows: [...{
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=Run
		// +link=/applications/{app}/envbinding/{env}/workflow/records/{run}
		run: string
		// +title=Finished
		// +format=time
		finished: string
		env: string
	}]
	rows: [for r in runs.$returns if parameter.all || r.status == "failed" {
		app:      r.app
		run:      r.name
		finished: r.finished
		env:      r.env
	}]
}
`

func TestParseSpec(t *testing.T) {
	spec, err := ParseSpec(failedRuns)
	require.NoError(t, err)
	assert.Equal(t, "Failed workflow runs", spec.Title)
	assert.Equal(t, "Runs that failed", spec.Description)
	assert.Equal(t, &ChartSpec{Type: "bar", X: "app", Title: "Failed runs by application"}, spec.Chart)
	assert.Equal(t, []Column{
		{Key: "app", Title: "Application", Link: "/applications/{app}/config"},
		{Key: "run", Title: "Run", Link: "/applications/{app}/envbinding/{env}/workflow/records/{run}"},
		{Key: "finished", Title: "Finished", Format: "time"},
	}, spec.Columns)
}

func TestParseSpecRefuses(t *testing.T) {
	for name, src := range map[string]string{
		"a package other than vela/report": "import \"vela/kube\"\ntemplate: rows: []",
		"no rows":                          "template: {}",
		"an unknown chart":                 "// +chart=radar\ntemplate: rows: [...{\n// +title=A\na: string}]",
		"a chart field that is no field":   "// +chart=bar\n// +chart:x=b\ntemplate: rows: [...{\n// +title=A\na: string}]",
		"a format it does not know":        "template: rows: [...{\n// +title=A\n// +format=money\na: string}]",
	} {
		t.Run(name, func(t *testing.T) {
			_, err := ParseSpec(src)
			assert.Error(t, err)
		})
	}
}

func TestRun(t *testing.T) {
	ctx := context.Background()

	t.Run("rows, links and the chart come from the report and the project", func(t *testing.T) {
		res, err := Run(ctx, failedRuns, &fakeSource{}, nil)
		require.NoError(t, err)
		assert.Equal(t, []apisv1.ReportColumn{
			{Key: "app", Title: "Application"},
			{Key: "run", Title: "Run"},
			{Key: "finished", Title: "Finished", Format: "time"},
		}, res.Columns)
		require.Len(t, res.Rows, 2)
		assert.Equal(t, "r1", res.Rows[0].Values["run"])
		assert.Equal(t, map[string]string{
			"app": "/applications/checkout/config",
			"run": "/applications/checkout/envbinding/production/workflow/records/r1",
		}, res.Rows[0].Links)
		assert.NotContains(t, res.Rows[0].Values, "env", "a field with no title is no column")
		assert.Equal(t, &apisv1.ReportChart{
			Type: "bar", Title: "Failed runs by application", Series: []string{"count"},
			Points: []apisv1.ReportPoint{
				{Label: "checkout", Values: map[string]float64{"count": 1}},
				{Label: "payments", Values: map[string]float64{"count": 1}},
			},
		}, res.Chart)
	})

	t.Run("parameters reach the report", func(t *testing.T) {
		res, err := Run(ctx, failedRuns, &fakeSource{}, map[string]interface{}{"all": true})
		require.NoError(t, err)
		assert.Len(t, res.Rows, 3)
	})

	t.Run("a report that imports another package is refused before it runs", func(t *testing.T) {
		_, err := Run(ctx, "import \"vela/kube\"\ntemplate: rows: []", &fakeSource{}, nil)
		assert.ErrorContains(t, err, `"vela/kube"`)
	})

	t.Run("List reads through the project's source", func(t *testing.T) {
		src := &fakeSource{}
		res, err := Run(ctx, `
import "vela/report"
template: {
	deployments: report.#List & {$params: {apiVersion: "apps/v1", kind: "Deployment"}}
	rows: [...{
		// +title=Name
		name: string
	}]
	rows: [for d in deployments.$returns {name: d.object.metadata.name}]
}`, src, nil)
		require.NoError(t, err)
		assert.Equal(t, []string{"apps/v1/Deployment"}, src.listed)
		assert.Equal(t, "web", res.Rows[0].Values["name"])
	})

	t.Run("a chart sums y per x, one series per group", func(t *testing.T) {
		res, err := Run(ctx, `
// +chart=line
// +chart:x=day
// +chart:y=n
// +chart:group=app
template: rows: [...{
	// +title=Day
	day: string
	// +title=App
	app: string
	// +title=N
	n: number
}]
template: rows: [
	{day: "2026-10-02", app: "a", n: 2},
	{day: "2026-10-01", app: "a", n: 1},
	{day: "2026-10-01", app: "b", n: 4},
	{day: "2026-10-01", app: "a", n: 3},
]`, &fakeSource{}, nil)
		require.NoError(t, err)
		assert.Equal(t, []string{"a", "b"}, res.Chart.Series)
		assert.Equal(t, []apisv1.ReportPoint{
			{Label: "2026-10-01", Values: map[string]float64{"a": 4, "b": 4}},
			{Label: "2026-10-02", Values: map[string]float64{"a": 2}},
		}, res.Chart.Points)
	})
}

func TestParameterSchemas(t *testing.T) {
	schemas, err := ParameterSchemas(failedRuns)
	require.NoError(t, err)
	require.NotNil(t, schemas)
	all := schemas.OpenAPI.Properties["all"]
	require.NotNil(t, all)
	assert.True(t, all.Value.Type.Is(openapi3.TypeBoolean))
	assert.Equal(t, false, all.Value.Default)
	assert.Equal(t, "Include succeeded runs too", all.Value.Description)
	require.Len(t, schemas.UI, 1)
	assert.Equal(t, "all", schemas.UI[0].JSONKey)
	assert.Equal(t, "Switch", schemas.UI[0].UIType)

	none, err := ParameterSchemas("template: rows: []")
	require.NoError(t, err)
	assert.Nil(t, none)
}

func TestQuantities(t *testing.T) {
	res, err := Run(context.Background(), `
import "vela/report"
template: rows: [...{
	// +title=In
	in: string | number
	// +title=Cores
	cores?: number
	// +title=MiB
	mib?: number
}]
template: rows: [
	for q in ["250m", "1.5", 2] {in: q, cores: (report.#CPU & {"in": q}).out},
	for q in ["256Mi", "1Gi", "1G", 1048576] {in: q, mib: (report.#Memory & {"in": q}).out},
]`, &fakeSource{}, nil)
	require.NoError(t, err)
	var cores, mib []interface{}
	for _, r := range res.Rows {
		if v, ok := r.Values["cores"]; ok {
			cores = append(cores, v)
		}
		if v, ok := r.Values["mib"]; ok {
			mib = append(mib, v)
		}
	}
	assert.Equal(t, []interface{}{0.25, 1.5, int64(2)}, cores)
	assert.InDeltaSlice(t, []float64{256, 1024, 953.67431640625, 1}, toFloats(mib), 0.0001)
}

func toFloats(in []interface{}) []float64 {
	out := []float64{}
	for _, v := range in {
		out = append(out, number(v))
	}
	return out
}

func TestStats(t *testing.T) {
	res, err := Run(context.Background(), `
import "vela/report"
template: {
	envs: report.#Environments
	stats: [{label: "Edited since deployed", value: len([for e in envs.$returns if e.edited {e}]), tone: "progressing"}]
	rows: [...{
		// +title=App
		app: string
	}]
	rows: [for e in envs.$returns {app: e.app}]
}`, &fakeSource{}, nil)
	require.NoError(t, err)
	assert.Equal(t, []apisv1.ReportStat{{Label: "Edited since deployed", Value: int64(1), Tone: "progressing"}}, res.Stats)
}

// objSource lists the given objects for any kind.
type objSource struct {
	fakeSource
	objs []Object
}

func (o *objSource) List(context.Context, string, string) ([]Object, error) { return o.objs, nil }

func TestListDropsNulls(t *testing.T) {
	src := Builtins()["requests-and-limits"]
	for name, spec := range map[string]map[string]interface{}{
		"null":    {"template": map[string]interface{}{"spec": map[string]interface{}{"containers": nil}}},
		"missing": {"template": map[string]interface{}{}},
		"a list": {"replicas": 2, "template": map[string]interface{}{"spec": map[string]interface{}{"containers": []interface{}{
			map[string]interface{}{"name": "a", "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "500m", "memory": "1Gi"}, "limits": nil}},
		}}}},
	} {
		t.Run(name, func(t *testing.T) {
			obj := Object{Cluster: "local", Namespace: "ns", Object: map[string]interface{}{"metadata": map[string]interface{}{"name": "w"}, "spec": spec}}
			res, err := Run(context.Background(), src, &objSource{objs: []Object{obj}}, nil)
			require.NoError(t, err, "a null field reads as absent")
			require.Len(t, res.Rows, 2, "the one object, listed as a Deployment and as a StatefulSet")
		})
	}
}
