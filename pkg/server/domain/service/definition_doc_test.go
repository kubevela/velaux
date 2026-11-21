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
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

const docTraitTemplate = `
patch: spec: replicas: parameter.replicas
parameter: {
	// +usage=How many pods to run
	replicas: *1 | int
}
`

func docService(t *testing.T, objs ...*v1beta1.TraitDefinition) *definitionServiceImpl {
	t.Helper()
	builder := fake.NewClientBuilder().WithScheme(common2.Scheme).WithRESTMapper(meta.NewDefaultRESTMapper(nil))
	for _, o := range objs {
		builder = builder.WithObjects(o)
	}
	return &definitionServiceImpl{KubeClient: builder.Build()}
}

func docTrait(annotations map[string]string) *v1beta1.TraitDefinition {
	return &v1beta1.TraitDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: "scaler", Namespace: "vela-system", Annotations: annotations},
		Spec:       v1beta1.TraitDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: docTraitTemplate}}},
	}
}

func TestDefinitionDoc(t *testing.T) {
	ctx := context.Background()
	svc := docService(t, docTrait(map[string]string{"definition.oam.dev/description": "Scale the workload"}))

	doc, err := svc.DefinitionDoc(ctx, "scaler", "trait", "")
	require.NoError(t, err)
	assert.Contains(t, doc.Markdown, "Scale the workload", "the description")
	assert.NotContains(t, doc.Markdown, "title:", "kubevela.io's front matter is not shown")
	assert.True(t, strings.HasPrefix(doc.Markdown, "## "), "the page starts at its first section")
	assert.Contains(t, doc.Markdown, "replicas", "the parameters")
	assert.Contains(t, doc.Markdown, "How many pods to run", "with their usage")

	zh, err := svc.DefinitionDoc(ctx, "scaler", "trait", "zh")
	require.NoError(t, err)
	assert.NotEqual(t, doc.Markdown, zh.Markdown, "lang=zh writes the headings in Chinese")

	_, err = svc.DefinitionDoc(ctx, "missing", "trait", "")
	assert.Equal(t, bcode.ErrDefinitionNotFound, err)

	_, err = svc.DefinitionDoc(ctx, "scaler", "workload", "")
	var b *bcode.Bcode
	require.ErrorAs(t, err, &b)
	assert.Equal(t, int32(70005), b.BusinessCode, "a type with no generated documentation")
}

func TestDefinitionDocSource(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithRESTMapper(meta.NewDefaultRESTMapper(nil)).WithObjects(&v1beta1.SourceDefinition{
		ObjectMeta: metav1.ObjectMeta{
			Name:        "profile",
			Namespace:   "vela-system",
			Annotations: map[string]string{"definition.oam.dev/description": "The environment's profile"},
		},
		Spec: v1beta1.SourceDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: `
$internal: {
	key: "profile-\(context.namespace)"
	keyInputs: ["namespace"]
}
schema: {
	// +usage=Environment tier
	tier: "dev" | "prod"
	// +usage=Replicas to run
	replicas: int
}
storage: {
	storageTTL:     "5m"
	onStaleFailure: "use-stale"
}
parameter: {
	// +usage=Which profile to read
	name: *"default" | string
}
output: {tier: "prod", replicas: 2}
`}}},
	}).Build()
	svc := &definitionServiceImpl{KubeClient: cli}

	doc, err := svc.DefinitionDoc(ctx, "profile", "source", "")
	require.NoError(t, err)
	assert.Contains(t, doc.Markdown, "The environment's profile", "the description")
	assert.Contains(t, doc.Markdown, "Which profile to read", "the parameters")
	assert.Contains(t, doc.Markdown, "## Outputs", "what the source returns")
	assert.Contains(t, doc.Markdown, "Replicas to run", "with each output's usage")
	assert.Contains(t, doc.Markdown, "## Cache", "how it is cached")
	assert.Contains(t, doc.Markdown, "5m", "its time to live")
	assert.Contains(t, doc.Markdown, "profile-\\(context.namespace)", "and its key")
	assert.Contains(t, doc.Markdown, "## Consumable from", "where it may be read")
}

func TestDefinitionDocExampleURL(t *testing.T) {
	ctx := context.Background()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("kind: Application\nmetadata:\n  name: scaled\n"))
	}))
	defer server.Close()
	svc := docService(t, docTrait(map[string]string{"definition.oam.dev/example-url": server.URL + "/scaler.yaml"}))

	doc, err := svc.DefinitionDoc(ctx, "scaler", "trait", "")
	require.NoError(t, err)
	assert.Contains(t, doc.Markdown, "```yaml\nkind: Application", "a YAML example is fenced as YAML")

	assert.Empty(t, fetchExample(ctx, "file:///etc/passwd"), "only http and https are fetched")
	assert.Empty(t, fetchExample(ctx, server.URL+"/missing\x7f"), "an unparseable URL is left out")
}

func TestDefinitionDocComponent(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithRESTMapper(meta.NewDefaultRESTMapper(nil)).WithObjects(&v1beta1.ComponentDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "vela-system"},
		Spec: v1beta1.ComponentDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: `
output: {apiVersion: "apps/v1", kind: "Deployment", spec: template: spec: containers: [{image: parameter.image}]}
parameter: {
	// +usage=The image to run
	image: string
}
`}}},
	}).Build()
	svc := &definitionServiceImpl{KubeClient: cli}
	doc, err := svc.DefinitionDoc(ctx, "web", "component", "")
	require.NoError(t, err)
	assert.Contains(t, doc.Markdown, "The image to run")
}

func TestDefinitionCUE(t *testing.T) {
	ctx := context.Background()
	svc := docService(t, docTrait(map[string]string{"definition.oam.dev/description": "Scale the workload"}))
	got, err := svc.DefinitionCUE(ctx, "scaler", "trait")
	require.NoError(t, err)
	assert.Contains(t, got.CUE, "scaler: {", "the definition as vela def get writes it")
	assert.Contains(t, got.CUE, `type: "trait"`)
	assert.Contains(t, got.CUE, `description: "Scale the workload"`)
	assert.Contains(t, got.CUE, "replicas: *1 | int", "with its template")

	_, err = svc.DefinitionCUE(ctx, "missing", "trait")
	assert.Equal(t, bcode.ErrDefinitionNotFound, err)
}

func TestDefinitionDocSourceWithoutParameters(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithRESTMapper(meta.NewDefaultRESTMapper(nil)).WithObjects(&v1beta1.SourceDefinition{
		ObjectMeta: metav1.ObjectMeta{
			Name:        "facts",
			Namespace:   "vela-system",
			Annotations: map[string]string{"definition.oam.dev/description": "Facts about the cluster"},
		},
		Spec: v1beta1.SourceDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: `
schema: {
	// +usage=Cluster name
	name: string
}
parameter: {}
output: name: "local"
`}}},
	}).Build()
	svc := &definitionServiceImpl{KubeClient: cli}

	doc, err := svc.DefinitionDoc(ctx, "facts", "source", "")
	require.NoError(t, err)
	assert.Contains(t, doc.Markdown, "Facts about the cluster", "the description")
	assert.NotContains(t, doc.Markdown, "## Specification", "no table for parameters it does not take")
	assert.Contains(t, doc.Markdown, "Cluster name", "its outputs")
}
