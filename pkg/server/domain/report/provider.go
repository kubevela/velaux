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
	_ "embed"
	"errors"

	"github.com/kubevela/pkg/cue/cuex"
	"github.com/kubevela/pkg/cue/cuex/providers"
	cuexruntime "github.com/kubevela/pkg/cue/cuex/runtime"
	"github.com/kubevela/pkg/util/runtime"
)

// PackageName is the one package a report may import.
const PackageName = "vela/report"

//go:embed report.cue
var template string

type none struct{}

type listParams struct {
	APIVersion string `json:"apiVersion"`
	Kind       string `json:"kind"`
}

var errNoSource = errors.New("a report reads a project, and none was given")

// read calls fn on the source the run gave the context.
func read[T any, U any](fn func(Source, context.Context, T) (U, error)) cuexruntime.GenericProviderFn[providers.Params[T], providers.Returns[U]] {
	return func(ctx context.Context, p *providers.Params[T]) (*providers.Returns[U], error) {
		source, ok := sourceFrom(ctx)
		if !ok {
			return nil, errNoSource
		}
		out, err := fn(source, ctx, p.Params)
		if err != nil {
			return nil, err
		}
		return &providers.Returns[U]{Returns: out}, nil
	}
}

// compiler is the only compiler reports run in: vela/report and CUE's own
// packages, nothing that writes, and nothing from the cluster.
var compiler = cuex.NewCompilerWithInternalPackages(
	runtime.Must(cuexruntime.NewInternalPackage("report", template, map[string]cuexruntime.ProviderFn{
		"apps":         read(func(s Source, ctx context.Context, _ none) ([]App, error) { return s.Apps(ctx) }),
		"components":   read(func(s Source, ctx context.Context, _ none) ([]Component, error) { return s.Components(ctx) }),
		"runs":         read(func(s Source, ctx context.Context, _ none) ([]WorkflowRun, error) { return s.Runs(ctx) }),
		"environments": read(func(s Source, ctx context.Context, _ none) ([]Environment, error) { return s.Environments(ctx) }),
		"definitions":  read(func(s Source, ctx context.Context, _ none) ([]Definition, error) { return s.Definitions(ctx) }),
		"list": read(func(s Source, ctx context.Context, p listParams) ([]Object, error) {
			objects, err := s.List(ctx, p.APIVersion, p.Kind)
			for i := range objects {
				objects[i].Object = withoutNulls(objects[i].Object)
			}
			return objects, err
		}),
	})),
)

// withoutNulls drops null fields, at any depth. A null reaches CUE as top, not
// null, where neither != _|_ nor a comparison can test it; absent, it can be.
func withoutNulls(m map[string]interface{}) map[string]interface{} {
	for k, v := range m {
		switch val := v.(type) {
		case nil:
			delete(m, k)
		case map[string]interface{}:
			m[k] = withoutNulls(val)
		case []interface{}:
			for i, item := range val {
				if sub, ok := item.(map[string]interface{}); ok {
					val[i] = withoutNulls(sub)
				}
			}
		}
	}
	return m
}
