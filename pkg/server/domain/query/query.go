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

// Package query runs VelaQL views for VelaUX: compiled with vela/ql's reads
// alone, against whatever client the caller hands it.
package query

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/parser"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kubevela/pkg/cue/cuex"
	cuexruntime "github.com/kubevela/pkg/cue/cuex/runtime"
	"github.com/kubevela/pkg/util/runtime"
	"github.com/kubevela/workflow/pkg/cue/model/value"
	"github.com/kubevela/workflow/pkg/providers/legacy/kube"
	providertypes "github.com/kubevela/workflow/pkg/providers/types"

	legacyquery "github.com/oam-dev/kubevela/pkg/workflow/providers/legacy/query"
	oamprovidertypes "github.com/oam-dev/kubevela/pkg/workflow/providers/types"
)

// ErrImport is returned for a view importing anything but vela/ql, vela/op and
// CUE's own packages.
var ErrImport = errors.New("a view may import vela/ql, vela/op and CUE's own packages only")

// qlReads are vela/ql's own functions, all of which read.
var qlReads = []string{"listResourcesInApp", "listAppliedResources", "collectResources", "searchEvents", "collectLogsInPod", "collectServiceEndpoints"}

// opReads are the kube functions vela/ql's #Read and #List call, under the op
// provider. #Apply, #Patch and #Delete find no function.
var opReads = []string{"read", "list"}

func pick(all map[string]cuexruntime.ProviderFn, names []string) map[string]cuexruntime.ProviderFn {
	out := map[string]cuexruntime.ProviderFn{}
	for _, name := range names {
		out[name] = all[name]
	}
	return out
}

// compiler is the only compiler views run in: vela/ql's reads, nothing that
// writes, and nothing from the cluster. op backs vela/ql's kube calls and holds
// only read and list, so a view importing it can read and nothing else.
var compiler = cuex.NewCompilerWithInternalPackages(
	runtime.Must(cuexruntime.NewInternalPackage("ql", legacyquery.GetTemplate(), pick(legacyquery.GetProviders(), qlReads))),
	runtime.Must(cuexruntime.NewInternalPackage("op", kube.GetTemplate(), pick(kube.GetProviders(), opReads))),
)

// Query is a parsed VelaQL statement.
type Query struct {
	Parameter map[string]interface{}
	Export    string
}

// Run compiles the view's CUE with q's parameters, reading through cli and cfg
// (for logs), and returns the value at q's export path.
func Run(ctx context.Context, view string, q Query, cli client.Client, cfg *rest.Config) (cue.Value, error) {
	if err := checkImports(view); err != nil {
		return cue.Value{}, err
	}
	ctx = oamprovidertypes.WithRuntimeParams(ctx, oamprovidertypes.RuntimeParams{
		KubeClient:   cli,
		KubeConfig:   cfg,
		KubeHandlers: &providertypes.KubeHandlers{Apply: refuseApply, Delete: refuseDelete},
	})
	v, err := compiler.CompileStringWithOptions(ctx, view, cuex.WithData("parameter", q.Parameter))
	if err != nil {
		return cue.Value{}, fmt.Errorf("failed to compile the view: %w", err)
	}
	res := v.LookupPath(value.FieldPath(q.Export))
	if !res.Exists() {
		return cuecontext.New().CompileString("null"), nil
	}
	return res, res.Err()
}

func refuseApply(context.Context, client.Client, string, string, ...*unstructured.Unstructured) error {
	return ErrReadOnly
}

func refuseDelete(context.Context, client.Client, string, string, *unstructured.Unstructured) error {
	return ErrReadOnly
}

// checkImports refuses a view importing anything but vela/ql, vela/op and CUE's
// own packages, whose paths have no dot in their first element and are not vela's.
func checkImports(view string) error {
	f, err := parser.ParseFile("view", view, parser.ImportsOnly)
	if err != nil {
		return err
	}
	for _, spec := range f.Imports {
		path, err := strconv.Unquote(spec.Path.Value)
		if err != nil {
			return err
		}
		if path == "vela/ql" || path == "vela/op" {
			continue
		}
		first := strings.SplitN(path, "/", 2)[0]
		if first == "vela" || strings.Contains(first, ".") {
			return fmt.Errorf("%w: %s", ErrImport, path)
		}
	}
	return nil
}
