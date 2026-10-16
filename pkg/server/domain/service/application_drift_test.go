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

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
)

func TestSpecDiffers(t *testing.T) {
	app := func(props string, names ...string) *v1beta1.Application {
		a := &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{Name: "shop", Namespace: "shop", Labels: map[string]string{"publishVersion": "v1"}}}
		for _, n := range names {
			a.Spec.Components = append(a.Spec.Components, common.ApplicationComponent{Name: n, Type: "webapp", Properties: &runtime.RawExtension{Raw: []byte(props)}})
		}
		return a
	}
	for name, c := range map[string]struct {
		deployed, current *v1beta1.Application
		want              bool
	}{
		"the same":                        {app(`{"image":"nginx:1.27","port":80}`, "api"), app(`{"image":"nginx:1.27","port":80}`, "api"), false},
		"properties in another key order": {app(`{"image":"nginx:1.27","port":80}`, "api"), app(`{"port":80, "image":"nginx:1.27"}`, "api"), false},
		"components in another order":     {app(`{}`, "api", "db"), app(`{}`, "db", "api"), false},
		"metadata alone differs":          {app(`{}`, "api"), func() *v1beta1.Application { a := app(`{}`, "api"); a.Labels = nil; return a }(), false},
		"a property changed":              {app(`{"image":"nginx:1.27"}`, "api"), app(`{"image":"nginx:1.27.1"}`, "api"), true},
		"a component added":               {app(`{}`, "api"), app(`{}`, "api", "db"), true},
		"an annotation that changes the render": {app(`{}`, "api"), func() *v1beta1.Application {
			a := app(`{}`, "api")
			a.Annotations = map[string]string{oam.AnnotationCelExpressions: "true"}
			return a
		}(), true},
	} {
		t.Run(name, func(t *testing.T) {
			got, err := specDiffers(c.deployed, c.current)
			require.NoError(t, err)
			assert.Equal(t, c.want, got)
		})
	}
}
