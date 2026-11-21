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
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
)

func propertiesCheckService() *expressionServiceImpl {
	def := &v1beta1.ComponentDefinition{ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: types.DefaultKubeVelaNS}}
	cm := &v1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "component-schema-web", Namespace: types.DefaultKubeVelaNS},
		Data: map[string]string{types.OpenapiV3JSONSchema: `{"type":"object","properties":{
			"replicas":{"type":"integer"},
			"label":{"type":"string"},
			"image":{"type":"object","properties":{"version":{"type":"integer"}}}}}`},
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(def, cm).Build()
	return &expressionServiceImpl{enabled: true, KubeClient: cli, DefinitionService: &definitionServiceImpl{KubeClient: cli}}
}

func TestCheckPropertiesRefusesAMistypedExpression(t *testing.T) {
	ctx := context.Background()
	svc := propertiesCheckService()
	app := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"}}

	err := svc.CheckProperties(ctx, app, "component", "component", "web", `{"replicas":"$(context.appName)"}`, "", "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "replicas", "the error names the property")
	assert.Contains(t, err.Error(), "int")

	err = svc.CheckProperties(ctx, app, "component", "component", "web", `{"image":{"version":"$(context.appName)"}}`, "", "")
	require.Error(t, err, "a nested property is checked against its own type")
	assert.Contains(t, err.Error(), "image.version")

	assert.NoError(t, svc.CheckProperties(ctx, app, "component", "component", "web", `{"label":"$(context.appName)","replicas":2}`, "", ""))
}

func TestCheckPropertiesOnlyWhereExpressionsAreRead(t *testing.T) {
	ctx := context.Background()
	svc := propertiesCheckService()
	mistyped := `{"replicas":"$(context.appName)"}`

	plain := &model.Application{Name: "shop"}
	assert.NoError(t, svc.CheckProperties(ctx, plain, "component", "component", "web", mistyped, "", ""), "an application not opted in reads $( literally")

	off := propertiesCheckService()
	off.enabled = false
	optedIn := &model.Application{Name: "shop", Annotations: map[string]string{oam.AnnotationCelExpressions: "true"}}
	assert.NoError(t, off.CheckProperties(ctx, optedIn, "component", "component", "web", mistyped, "", ""), "nor where expressions are off")

	assert.NoError(t, svc.CheckProperties(ctx, optedIn, "component", "component", "missing", mistyped, "", ""), "a type with no schema is left to the controller")
}
