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
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

func TestIgnoreSomeParamsKeepsWhatChangesTheRender(t *testing.T) {
	app := &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{
		Name: "shop", Namespace: "shop",
		Labels: map[string]string{"team": "a"},
		Annotations: map[string]string{
			oam.AnnotationCelExpressions:       "true",
			oam.AnnotationAutoUpdate:           "true",
			oam.AnnotationFilterAnnotationKeys: "a",
			oam.AnnotationFilterLabelKeys:      "b",
			oam.AnnotationPublishVersion:       "v9",
			"example.com/anything":             "x",
		},
	}}
	ignoreSomeParams(app)
	assert.Equal(t, map[string]string{
		oam.AnnotationCelExpressions:       "true",
		oam.AnnotationAutoUpdate:           "true",
		oam.AnnotationFilterAnnotationKeys: "a",
		oam.AnnotationFilterLabelKeys:      "b",
	}, app.Annotations, "what decides how KubeVela renders stays; what differs on every deploy goes")
	assert.Empty(t, app.Labels)
	assert.Equal(t, "shop", app.Name)
}

func TestCompareOutcome(t *testing.T) {
	resp := func() *apisv1.AppCompareResponse {
		return &apisv1.AppCompareResponse{IsDiff: true, BaseAppYAML: "a", TargetAppYAML: "b"}
	}
	t.Run("a comparison that fails says so, not that nothing differs", func(t *testing.T) {
		out := compareOutcome(resp(), false, errors.New("cannot render"))
		assert.False(t, out.IsDiff)
		assert.Contains(t, out.Error, "cannot render")
		assert.Equal(t, "a", out.BaseAppYAML, "both Applications are still there to show")
	})
	t.Run("a comparison says whether the two differ", func(t *testing.T) {
		assert.True(t, compareOutcome(resp(), true, nil).IsDiff)
		out := compareOutcome(resp(), false, nil)
		assert.False(t, out.IsDiff)
		assert.Empty(t, out.Error)
	})
}
