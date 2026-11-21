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
	"testing"

	oamv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/runtime"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

func raw(s string) *runtime.RawExtension { return &runtime.RawExtension{Raw: []byte(s)} }

func flowNamed(flows []*apisv1.DataFlow, from, to, via string, toCluster ...string) *apisv1.DataFlow {
	for _, f := range flows {
		if len(toCluster) > 0 && f.To.Cluster != toCluster[0] {
			continue
		}
		if f.From.Name == from && f.To.Name == to && f.Via == via {
			return f
		}
	}
	return nil
}

func TestDataFlows(t *testing.T) {
	app := &v1beta1.Application{
		Spec: v1beta1.ApplicationSpec{Components: []common.ApplicationComponent{
			{Name: "db", Type: "k8s-objects"},
			{Name: "my-db", Type: "k8s-objects"},
			{Name: "cache", Type: "worker"},
			{
				Name: "api", Type: "webservice",
				Outputs: oamv1alpha1.StepOutputs{{Name: "token", ValueFrom: "output.status.token"}},
			},
			{
				Name: "web", Type: "webservice",
				DependsOn: []string{"cache", "db"},
				Inputs:    oamv1alpha1.StepInputs{{From: "token", ParameterKey: "env[2].value"}},
				Properties: raw(`{"image":"nginx","env":[
					{"name":"DB_HOST","value":"$(component.db.output.data.host)"},
					{"name":"DB_PORT","value":"x-$(component[\"my-db\"].cluster(\"east\").output.data.port)"}
				]}`),
				Traits: []common.ApplicationTrait{{Type: "labels", Properties: raw(`{"api":"$(component.api.outputs.svc.spec.ports[0].port)"}`)}},
			},
		}},
		Status: common.AppStatus{Sources: []common.ApplicationSourceStatus{{
			Name: "cfg", Type: "configmap",
			ConsumedBy: []common.SourceConsumer{
				{DefinitionKind: "component", Name: "web", Cluster: "local", Namespace: "prod",
					Values: []common.SourceValue{{SourceAttr: "data.image", Property: "image", Value: raw(`"nginx:1.27"`)}}},
				{DefinitionKind: "trait", Name: "web/labels", Values: []common.SourceValue{{SourceAttr: "data.team", Property: "team"}}},
				{DefinitionKind: "workflowstep", Name: "notify"},
			},
		}}},
	}
	flows := dataFlows(app)

	src := flowNamed(flows, "cfg", "web", flowViaSource, "local")
	require.NotNil(t, src, "a source flows to the component reading it")
	assert.Equal(t, apisv1.DataFlowEnd{Kind: "component", Name: "web", Cluster: "local", Namespace: "prod"}, src.To)
	assert.Equal(t, []apisv1.DataFlowItem{{Read: "data.image", Property: "image", Value: "nginx:1.27"}}, src.Items, "with the value it read")
	traitSrc := 0
	for _, f := range flows {
		if f.Via == flowViaSource && f.To.Name == "web" && f.To.Cluster == "" {
			traitSrc++
			assert.Equal(t, "labels", f.Items[0].Trait, "a trait's read names the trait")
		}
	}
	assert.Equal(t, 1, traitSrc)
	for _, f := range flows {
		assert.NotEqual(t, "notify", f.To.Name, "a workflow step is not a component on the graph")
	}

	db := flowNamed(flows, "db", "web", flowViaExpression)
	require.NotNil(t, db)
	assert.Equal(t, []apisv1.DataFlowItem{{Read: "component.db.output.data.host", Property: "env[0].value"}}, db.Items, "a read is the expression as written")

	myDB := flowNamed(flows, "my-db", "web", flowViaExpression)
	require.NotNil(t, myDB, "an index-form read names the component")
	assert.Equal(t, "east", myDB.From.Cluster, "and the placement it reads")
	assert.Equal(t, `component["my-db"].cluster("east").output.data.port`, myDB.Items[0].Read)
	assert.Equal(t, "env[1].value", myDB.Items[0].Property)

	trait := flowNamed(flows, "api", "web", flowViaExpression)
	require.NotNil(t, trait)
	assert.Equal(t, apisv1.DataFlowItem{Read: "component.api.outputs.svc.spec.ports[0].port", Property: "api", Trait: "labels"}, trait.Items[0],
		"down to the list index a path alone would drop")

	inputs := flowNamed(flows, "api", "web", flowViaInputs)
	require.NotNil(t, inputs)
	assert.Equal(t, []apisv1.DataFlowItem{{Read: "output.status.token", Property: "env[2].value"}}, inputs.Items)

	order := flowNamed(flows, "cache", "web", flowViaDependsOn)
	require.NotNil(t, order, "dependsOn with no data is an order-only flow")
	assert.Empty(t, order.Items)
	assert.Nil(t, flowNamed(flows, "db", "web", flowViaDependsOn), "a dependsOn that data already flows along is not repeated")
}
