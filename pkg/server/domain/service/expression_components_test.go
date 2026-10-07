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

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// oneEnv binds an application to a single deployed Application.
type oneEnv struct {
	EnvBindingService
	namespace, name string
}

func (o oneEnv) GetEnvBindings(context.Context, *model.Application) ([]*apisv1.EnvBindingBase, error) {
	return []*apisv1.EnvBindingBase{{Name: "prod", AppDeployNamespace: o.namespace, AppDeployName: o.name}}, nil
}

// shop is a deployed Application whose db component applied a ConfigMap
// workload and a route trait resource, as its ResourceTracker records them.
func shopExpressionService(t *testing.T) *expressionServiceImpl {
	t.Helper()
	app := &v1beta1.Application{
		ObjectMeta: metav1.ObjectMeta{Name: "shop", Namespace: "prod"},
		Spec: v1beta1.ApplicationSpec{Components: []common.ApplicationComponent{
			{Name: "db", Type: "k8s-objects"},
			{Name: "api", Type: "webservice", Traits: []common.ApplicationTrait{{Type: "expose"}}},
		}},
	}
	rt := &v1beta1.ResourceTracker{
		ObjectMeta: metav1.ObjectMeta{Name: "shop-v1-prod", Labels: map[string]string{
			oam.LabelAppName: "shop", oam.LabelAppNamespace: "prod",
		}},
		Spec: v1beta1.ResourceTrackerSpec{Type: v1beta1.ResourceTrackerTypeVersioned, ManagedResources: []v1beta1.ManagedResource{
			{
				ClusterObjectReference: common.ClusterObjectReference{ObjectReference: corev1.ObjectReference{APIVersion: "v1", Kind: "ConfigMap", Namespace: "prod", Name: "db"}},
				OAMObjectReference:     common.OAMObjectReference{Component: "db"},
			},
			{
				ClusterObjectReference: common.ClusterObjectReference{ObjectReference: corev1.ObjectReference{APIVersion: "v1", Kind: "Service", Namespace: "prod", Name: "db-route"}},
				OAMObjectReference:     common.OAMObjectReference{Component: "db", Trait: "expose"},
			},
		}},
	}
	workload := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "db", Namespace: "prod"},
		Data:       map[string]string{"host": "db.internal", "port": "5432"},
	}
	route := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{Name: "db-route", Namespace: "prod", Labels: map[string]string{oam.TraitResource: "route"}},
		Spec:       corev1.ServiceSpec{ClusterIP: "10.0.0.7"},
	}
	schemas := []*corev1.ConfigMap{
		schemaConfigMap("component-schema-webservice", map[string]string{
			componentOutputSchemaKey: `{"type":"object","properties":{"kind":{"type":"string"},"spec":{"type":"object","properties":{"replicas":{"type":"integer"}}},"status":{}}}`,
		}),
		schemaConfigMap("component-schema-k8s-objects", map[string]string{
			componentOutputSchemaKey: `{"type":"object","properties":{"kind":{"type":"string"},"data":{"type":"object","properties":{"host":{"type":"integer"}}}}}`,
		}),
		schemaConfigMap("trait-schema-expose", map[string]string{
			componentOutputsSchemaKey: `{"service":{"type":"object","properties":{"spec":{"type":"object","properties":{"ports":{"type":"array","items":{"type":"object","properties":{"port":{"type":"integer"}}}}}}}}}`,
		}),
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(app, rt, workload, route, schemas[0], schemas[1], schemas[2]).Build()
	return &expressionServiceImpl{enabled: true, KubeClient: cli, EnvBindingService: oneEnv{namespace: "prod", name: "shop"}}
}

func schemaConfigMap(name string, data map[string]string) *corev1.ConfigMap {
	return &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: "vela-system"}, Data: data}
}

func root(env *apisv1.ExpressionEnvResponse, name string) *apisv1.ExpressionVariable {
	for _, v := range env.Variables {
		if v.Name == name {
			return v
		}
	}
	return nil
}

func child(v *apisv1.ExpressionVariable, path ...string) *apisv1.ExpressionVariable {
	for _, name := range path {
		if v == nil {
			return nil
		}
		var next *apisv1.ExpressionVariable
		for _, c := range v.Children {
			if c.Name == name {
				next = c
			}
		}
		v = next
	}
	return v
}

// A component reads the other components' live output and trait resources, not
// its own.
func TestExpressionEnvReadsComponents(t *testing.T) {
	svc := shopExpressionService(t)
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"}}

	env, err := svc.Env(context.Background(), app, "component", "", "api")
	require.NoError(t, err)
	components := root(env, "component")
	require.NotNil(t, components)
	var names []string
	for _, c := range components.Children {
		names = append(names, c.Name)
	}
	assert.Equal(t, []string{"db"}, names, "a component does not read itself")

	host := child(components, "db", "output", "data", "host")
	require.NotNil(t, host, "the workload's live fields are offered")
	assert.Equal(t, "string", host.Type)
	assert.Empty(t, host.Schema, "a live field offers its type, never its value")
	assert.Equal(t, "string", child(components, "db", "outputs", "route", "spec", "clusterIP").Type)
	assert.Nil(t, child(components, "db", "output", "metadata", "managedFields"))

	for _, path := range [][]string{{"db", "output", "status"}, {"db", "outputs", "route", "status"}} {
		status := child(components, path...)
		require.NotNil(t, status, "%v is offered whether or not the object has one yet", path)
		assert.Equal(t, "dyn", status.Type, "%v is the controller's, read as any and cast", path)
		assert.Empty(t, status.Children)
	}

	trait, err := svc.Env(context.Background(), app, "trait", "", "db")
	require.NoError(t, err)
	var traitReads []string
	for _, c := range root(trait, "component").Children {
		traitReads = append(traitReads, c.Name)
	}
	assert.Equal(t, []string{"api"}, traitReads, "a trait reads the other components, not its own")

	src, err := svc.Env(context.Background(), app, "source", "first", "")
	require.NoError(t, err)
	assert.Nil(t, root(src, "component"), "a source cannot read a component")
}

// A component offers what its type and traits declare they apply, with its live
// fields layered on top once it is deployed.
func TestExpressionEnvReadsOutputSchemas(t *testing.T) {
	svc := shopExpressionService(t)
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"}}

	env, err := svc.Env(context.Background(), app, "component", "", "db")
	require.NoError(t, err)
	api := child(root(env, "component"), "api")
	require.NotNil(t, api)
	assert.Equal(t, "int", child(api, "output", "spec", "replicas").Type, "an undeployed component offers its type's output")
	assert.Equal(t, "dyn", child(api, "output", "status").Type)
	assert.Equal(t, "list(object)", child(api, "outputs", "service", "spec", "ports").Type, "and each trait's outputs")
	assert.Equal(t, "dyn", child(api, "outputs", "service", "status").Type)

	env, err = svc.Env(context.Background(), app, "component", "", "api")
	require.NoError(t, err)
	db := child(root(env, "component"), "db")
	assert.Equal(t, "string", child(db, "output", "kind").Type, "a declared field is offered before the object has it")
	assert.Equal(t, "string", child(db, "output", "data", "host").Type, "a live field's type is what the object holds")
	assert.NotNil(t, child(db, "output", "data", "port"), "a live field the template does not declare is offered")
}

// The check refuses a component read where the controller would.
func TestExpressionCheckComponentReads(t *testing.T) {
	svc := shopExpressionService(t)
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"}}
	check := func(surface, component, value string) []string {
		got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: surface, Component: component, Value: value})
		require.NoError(t, err)
		var msgs []string
		for _, i := range got.Issues {
			msgs = append(msgs, i.Message)
		}
		return msgs
	}
	assert.Empty(t, check("component", "api", "$(component.db.output.data.host)"))
	assert.Empty(t, check("trait", "api", `$(component.db.cluster("east").output.data.host)`))
	assert.Equal(t, []string{"a component cannot read its own output"}, check("component", "db", "$(component.db.output.data.host)"))
	assert.Equal(t, []string{"no component named cache"}, check("component", "api", "$(component.cache.output)"))
	assert.Equal(t, []string{"only component and trait properties can read component.<name>"},
		check("workflowstep", "", "$(component.db.output.data.host)"))
	assert.Equal(t, []string{`write component["my-db"]: a component whose name has a hyphen is read by index`},
		check("component", "api", "$(component.my-db.output.data.host)"))

	value := "x-$(component.my-db.output.data.host)"
	got, err := svc.Check(context.Background(), app, apisv1.ExpressionCheckRequest{Surface: "component", Component: "api", Value: value})
	require.NoError(t, err)
	require.Len(t, got.Issues, 1)
	issue := got.Issues[0]
	assert.Equal(t, "component.my-db", value[issue.Start:issue.End], "the issue covers the read to replace")
	assert.Equal(t, `component["my-db"]`, issue.Fix, "and carries its replacement")
	assert.Equal(t, []string{"no component named my-db"}, check("component", "api", `$(component["my-db"].output)`),
		"the index form reads the name it gives")
}
