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
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	configv1alpha1 "github.com/oam-dev/kubevela/apis/config.oam.dev/v1alpha1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/config"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

const clusterInfoTemplate = `
metadata: {name: "cluster-info", alias: "Cluster info", scope: "system"}
template: {
	outputs: info: {apiVersion: "v1", kind: "ConfigMap", metadata: {name: "cluster-info", namespace: "vela-system"}, data: parameter}
	parameter: {
		clusterName: string
		environment: "dev" | "staging" | "prod"
	}
}
`

const legacyTemplate = `
metadata: {name: "image-registry", alias: "Image registry", scope: "system"}
template: {
	parameter: registry: string
}
`

func configCRDService(t *testing.T, objs ...client.Object) (*configServiceImpl, client.Client) {
	t.Helper()
	legacy := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: config.TemplateConfigMapNamePrefix + "image-registry", Namespace: types.DefaultKubeVelaNS,
			Labels:      map[string]string{types.LabelConfigCatalog: types.VelaCoreConfig, types.LabelConfigScope: "system"},
			Annotations: map[string]string{types.AnnotationConfigAlias: "Image registry"}},
		Data: map[string]string{config.SaveTemplateKey: legacyTemplate},
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).
		WithStatusSubresource(&configv1alpha1.Config{}).
		WithObjects(append(objs, legacy,
			&configv1alpha1.ConfigTemplate{
				ObjectMeta: metav1.ObjectMeta{Name: "cluster-info", Namespace: types.DefaultKubeVelaNS},
				Spec:       configv1alpha1.ConfigTemplateSpec{Template: clusterInfoTemplate, Scope: "system", Alias: "Cluster info"},
			},
			&configv1alpha1.ConfigTemplate{
				ObjectMeta: metav1.ObjectMeta{Name: "source-cluster-info-1234", Namespace: types.DefaultKubeVelaNS,
					Labels: map[string]string{types.LabelSourceDefinitionName: "cluster-info"}},
				Spec: configv1alpha1.ConfigTemplateSpec{Template: clusterInfoTemplate, Scope: "system"},
			})...).Build()
	return &configServiceImpl{KubeClient: cli, Factory: config.NewConfigFactory(cli)}, cli
}

func TestListTemplatesMarksLegacy(t *testing.T) {
	svc, _ := configCRDService(t)
	templates, err := svc.ListTemplates(context.Background(), NoProject, "system")
	require.NoError(t, err)
	legacy := map[string]bool{}
	for _, tpl := range templates {
		legacy[tpl.Name] = tpl.Legacy
	}
	assert.Equal(t, map[string]bool{"cluster-info": false, "image-registry": true}, legacy,
		"a ConfigTemplate is listed, a ConfigMap template is legacy, and a source's generated template is not offered")
}

// The Config webhook refuses any change to templateRef, so an update has to
// leave it as written, even where it names the template's namespace only by
// default.
func TestUpdatingAConfigKeepsItsTemplateRef(t *testing.T) {
	ctx := context.Background()
	existing := &configv1alpha1.Config{
		ObjectMeta: metav1.ObjectMeta{Name: "cluster-info", Namespace: types.DefaultKubeVelaNS},
		Spec: configv1alpha1.ConfigSpec{
			TemplateRef: &configv1alpha1.ConfigTemplateReference{Name: "cluster-info"},
			Properties:  &runtime.RawExtension{Raw: []byte(`{"clusterName":"a","environment":"dev"}`)},
		},
	}
	svc, cli := configCRDService(t, existing)
	_, err := svc.UpdateConfig(ctx, NoProject, "cluster-info", apis.UpdateConfigRequest{Properties: `{"clusterName":"a","environment":"prod"}`})
	require.NoError(t, err)
	got := &configv1alpha1.Config{}
	require.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: "cluster-info"}, got))
	assert.Equal(t, configv1alpha1.ConfigTemplateReference{Name: "cluster-info"}, *got.Spec.TemplateRef)
}

func TestConfigsOfATemplateCRDAreConfigCRs(t *testing.T) {
	ctx := context.Background()
	svc, cli := configCRDService(t)

	created, err := svc.CreateConfig(ctx, NoProject, apis.CreateConfigRequest{
		Name:       "cluster-info",
		Template:   apis.NamespacedName{Name: "cluster-info"},
		Properties: `{"clusterName":"prod-eu-1","environment":"dev"}`,
	})
	require.NoError(t, err)
	assert.False(t, created.Legacy)

	cr := &configv1alpha1.Config{}
	require.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: "cluster-info"}, cr))
	assert.Equal(t, "cluster-info", cr.Spec.TemplateRef.Name)
	assert.JSONEq(t, `{"clusterName":"prod-eu-1","environment":"dev"}`, string(cr.Spec.Properties.Raw))

	_, err = svc.CreateConfig(ctx, NoProject, apis.CreateConfigRequest{
		Name: "broken", Template: apis.NamespacedName{Name: "cluster-info"}, Properties: `{"clusterName":"x","environment":"qa"}`,
	})
	assert.Error(t, err, "properties the template refuses are refused before a Config is written")

	cr.Status.Phase = configv1alpha1.ConfigPhase("Available")
	require.NoError(t, cli.Status().Update(ctx, cr))
	configs, err := svc.ListConfigs(ctx, NoProject, "", true)
	require.NoError(t, err)
	require.Len(t, configs, 1)
	assert.Equal(t, "cluster-info", configs[0].Name)
	assert.Equal(t, "Available", configs[0].Phase)
	assert.Equal(t, "prod-eu-1", configs[0].Properties["clusterName"])

	_, err = svc.UpdateConfig(ctx, NoProject, "cluster-info", apis.UpdateConfigRequest{Properties: `{"clusterName":"prod-eu-1","environment":"prod"}`})
	require.NoError(t, err)
	got, err := svc.GetConfig(ctx, NoProject, "cluster-info")
	require.NoError(t, err)
	assert.Equal(t, "prod", got.Properties["environment"])

	require.NoError(t, svc.DeleteConfig(ctx, NoProject, "cluster-info"))
	assert.Error(t, cli.Get(ctx, client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: "cluster-info"}, &configv1alpha1.Config{}))
}

func TestSourceCacheConfigsAreNotListed(t *testing.T) {
	ctx := context.Background()
	cached := &configv1alpha1.Config{
		ObjectMeta: metav1.ObjectMeta{Name: "cluster-info-5bdee5ba", Namespace: types.DefaultKubeVelaNS,
			Labels: map[string]string{types.LabelSourceDefinitionName: "cluster-info"}},
		Spec: configv1alpha1.ConfigSpec{TemplateRef: &configv1alpha1.ConfigTemplateReference{Name: "source-cluster-info-1234"}},
	}
	svc, _ := configCRDService(t, cached)
	_, err := svc.CreateConfig(ctx, NoProject, apis.CreateConfigRequest{
		Name:       "cluster-info",
		Template:   apis.NamespacedName{Name: "cluster-info"},
		Properties: `{"clusterName":"prod-eu-1","environment":"dev"}`,
	})
	require.NoError(t, err)

	configs, err := svc.ListConfigs(ctx, NoProject, "", false)
	require.NoError(t, err)
	var names []string
	for _, c := range configs {
		names = append(names, c.Name)
	}
	assert.Equal(t, []string{"cluster-info"}, names, "a source's cached value is not a config anyone wrote")
}

func TestProjectTemplateUISchemaIsItsOwn(t *testing.T) {
	uiSchema := func(namespace, label string) *corev1.ConfigMap {
		return &corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: "config-uischema-team-info", Namespace: namespace},
			Data:       map[string]string{types.UISchema: `[{"jsonKey":"clusterName","label":"` + label + `"}]`},
		}
	}
	svc, _ := configCRDService(t,
		&configv1alpha1.ConfigTemplate{
			ObjectMeta: metav1.ObjectMeta{Name: "team-info", Namespace: "shop"},
			Spec:       configv1alpha1.ConfigTemplateSpec{Template: clusterInfoTemplate, Scope: "project", Alias: "Team info"},
		},
		uiSchema("shop", "Shop's cluster"),
		uiSchema(types.DefaultKubeVelaNS, "Someone else's"),
	)
	detail, err := svc.GetTemplate(context.Background(), config.NamespacedName{Name: "team-info", Namespace: "shop"})
	require.NoError(t, err)
	labels := map[string]string{}
	for _, p := range detail.UISchema {
		labels[p.JSONKey] = p.Label
	}
	assert.Equal(t, "Shop's cluster", labels["clusterName"], "the UI schema beside the template, in its namespace")
}
