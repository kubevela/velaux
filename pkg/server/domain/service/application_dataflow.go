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
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/definition/celexpr"
	"github.com/oam-dev/kubevela/pkg/definition/propexpr"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// How a flow carries data.
const (
	flowViaSource     = "source"
	flowViaExpression = "expression"
	flowViaInputs     = "inputs"
	flowViaDependsOn  = "dependsOn"
)

// GetApplicationDataFlows is what moves between the sources and components of
// the Application an env deploys; none where it is not deployed.
func (c *applicationServiceImpl) GetApplicationDataFlows(ctx context.Context, appmodel *model.Application, envName string) (*apisv1.ApplicationDataFlowsResponse, error) {
	env, err := c.EnvService.GetEnv(ctx, envName)
	if err != nil {
		return nil, err
	}
	envBinding, err := c.EnvBindingService.GetEnvBinding(ctx, appmodel, envName)
	if err != nil {
		return nil, err
	}
	app := &v1beta1.Application{}
	if err := c.KubeClient.Get(ctx, types.NamespacedName{Namespace: env.Namespace, Name: envBinding.AppDeployName}, app); err != nil {
		if apierrors.IsNotFound(err) {
			return &apisv1.ApplicationDataFlowsResponse{Flows: []*apisv1.DataFlow{}}, nil
		}
		return nil, err
	}
	return &apisv1.ApplicationDataFlowsResponse{Flows: dataFlows(app)}, nil
}

// dataFlows reads an Application's data flows: the source values its status
// records, the component reads its properties' expressions make, the outputs
// its components' inputs take, and the dependsOn that order without data.
func dataFlows(app *v1beta1.Application) []*apisv1.DataFlow {
	flows := flowSet{}
	for _, s := range app.Status.Sources {
		for _, consumer := range s.ConsumedBy {
			reader, trait := consumerComponent(consumer)
			if reader == "" {
				continue
			}
			from := apisv1.DataFlowEnd{Kind: "source", Name: s.Name}
			to := apisv1.DataFlowEnd{Kind: componentKind, Name: reader, Cluster: consumer.Cluster, Namespace: consumer.Namespace}
			flow := flows.get(from, to, flowViaSource)
			for _, v := range consumer.Values {
				flow.Items = append(flow.Items, apisv1.DataFlowItem{Read: v.SourceAttr, Property: v.Property, Trait: trait, Value: rawValue(v.Value)})
			}
		}
	}

	outputs := map[string][2]string{}
	for _, comp := range app.Spec.Components {
		for _, out := range comp.Outputs {
			outputs[out.Name] = [2]string{comp.Name, out.ValueFrom}
		}
	}
	for _, comp := range app.Spec.Components {
		to := apisv1.DataFlowEnd{Kind: componentKind, Name: comp.Name}
		componentReads(flows, to, "", comp.Properties)
		for _, t := range comp.Traits {
			componentReads(flows, to, t.Type, t.Properties)
		}
		for _, in := range comp.Inputs {
			out, ok := outputs[in.From]
			if !ok {
				continue
			}
			flow := flows.get(apisv1.DataFlowEnd{Kind: componentKind, Name: out[0]}, to, flowViaInputs)
			flow.Items = append(flow.Items, apisv1.DataFlowItem{Read: out[1], Property: in.ParameterKey})
		}
	}
	for _, comp := range app.Spec.Components {
		for _, dep := range comp.DependsOn {
			if !flows.carries(dep, comp.Name) {
				flows.get(apisv1.DataFlowEnd{Kind: componentKind, Name: dep}, apisv1.DataFlowEnd{Kind: componentKind, Name: comp.Name}, flowViaDependsOn)
			}
		}
	}
	return flows.list()
}

// componentReads adds the component reads the expressions in a component's or
// trait's properties make, each at the property holding it.
func componentReads(flows flowSet, to apisv1.DataFlowEnd, trait string, props *runtime.RawExtension) {
	if props == nil || len(props.Raw) == 0 {
		return
	}
	var tree interface{}
	if json.Unmarshal(props.Raw, &tree) != nil {
		return
	}
	_ = propexpr.Walk(tree, "", func(path, raw string) error {
		if !propexpr.MayContainExpr(raw) {
			return nil
		}
		parsed, err := propexpr.Parse(raw)
		if err != nil {
			return nil //nolint:nilerr // the controller reports a malformed expression; a graph shows what it can
		}
		for _, f := range parsed.Fragments {
			if !f.IsExpr() {
				continue
			}
			refs, err := celexpr.PropertyReferences(f.Expr)
			if err != nil {
				continue
			}
			for _, r := range refs {
				if !r.IsComponent() || len(r.Path) == 0 {
					continue
				}
				calls, rest := r.Placement()
				from := apisv1.DataFlowEnd{Kind: componentKind, Name: rest[0]}
				for _, call := range calls {
					fn, arg := propexpr.SplitPlacementCall(call)
					switch fn {
					case "cluster":
						from.Cluster = arg
					case "namespace":
						from.Namespace = arg
					}
				}
				// Read is the expression as written: a reference's path stops at a
				// list index, which is often the part that says what is read.
				flow := flows.get(from, to, flowViaExpression)
				flow.Items = append(flow.Items, apisv1.DataFlowItem{Read: strings.TrimSpace(f.Expr), Property: path, Trait: trait})
			}
		}
		return nil
	})
}

// consumerComponent is the component a source reader is or belongs to, and the
// trait when a trait read it; "" for a workflow step or policy.
func consumerComponent(c common.SourceConsumer) (string, string) {
	switch c.DefinitionKind {
	case componentKind:
		return c.Name, ""
	case traitKind:
		comp, trait, _ := strings.Cut(c.Name, "/")
		return comp, trait
	}
	return "", ""
}

func rawValue(v *runtime.RawExtension) interface{} {
	if v == nil || len(v.Raw) == 0 {
		return nil
	}
	var out interface{}
	if json.Unmarshal(v.Raw, &out) != nil {
		return nil
	}
	return out
}

// flowSet gathers flows by their ends and how they carry data.
type flowSet map[string]*apisv1.DataFlow

func (s flowSet) get(from, to apisv1.DataFlowEnd, via string) *apisv1.DataFlow {
	key := fmt.Sprintf("%+v|%+v|%s", from, to, via)
	if f, ok := s[key]; ok {
		return f
	}
	f := &apisv1.DataFlow{From: from, To: to, Via: via, Items: []apisv1.DataFlowItem{}}
	s[key] = f
	return f
}

// carries reports whether a flow already moves data from one component to another.
func (s flowSet) carries(from, to string) bool {
	for _, f := range s {
		if f.From.Kind == componentKind && f.From.Name == from && f.To.Name == to {
			return true
		}
	}
	return false
}

func (s flowSet) list() []*apisv1.DataFlow {
	keys := make([]string, 0, len(s))
	for k := range s {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	out := make([]*apisv1.DataFlow, 0, len(keys))
	for _, k := range keys {
		f := s[k]
		sort.SliceStable(f.Items, func(i, j int) bool { return f.Items[i].Property < f.Items[j].Property })
		out = append(out, f)
	}
	return out
}
