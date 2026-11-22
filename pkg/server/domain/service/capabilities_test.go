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
	"errors"
	"testing"

	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// velaCore is the vela-core Deployment as its chart installs it, running image.
func velaCore(image string, labelled bool) *appsv1.Deployment {
	d := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{Name: types.KubeVelaControllerDeployment, Namespace: types.DefaultKubeVelaNS},
		Spec: appsv1.DeploymentSpec{Template: corev1.PodTemplateSpec{Spec: corev1.PodSpec{
			Containers: []corev1.Container{{Name: types.DefaultKubeVelaReleaseName, Image: image}},
		}}},
	}
	if labelled {
		d.Labels = map[string]string{oam.LabelControllerName: oam.ApplicationControllerName}
	}
	return d
}

func capabilitiesOf(t *testing.T, objs ...client.Object) apisv1.ControllerCapabilities {
	t.Helper()
	cli := fake.NewClientBuilder().WithScheme(clientgoscheme.Scheme).WithObjects(objs...).Build()
	return controllerCapabilities(context.Background(), cli)
}

func TestControllerCapabilities(t *testing.T) {
	for _, tc := range []struct {
		name    string
		objs    []client.Object
		version string
		resync  bool
		restart bool
	}{
		{"1.10 has neither", []client.Object{velaCore("oamdev/vela-core:v1.10.10", true)}, "v1.10.10", false, false},
		{"1.11 has both", []client.Object{velaCore("oamdev/vela-core:v1.11.2", true)}, "v1.11.2", true, true},
		{"1.12 prereleases have both", []client.Object{velaCore("oamdev/vela-core:v1.12.0-alpha.2", true)}, "v1.12.0-alpha.2", true, true},
		{"a tag without a v", []client.Object{velaCore("registry.local:5000/vela-core:1.10.6", true)}, "1.10.6", false, false},
		{"an unlabelled Deployment is found by name", []client.Object{velaCore("oamdev/vela-core:v1.10.10", false)}, "v1.10.10", false, false},
		{"a build of a branch is assumed to have both", []client.Object{velaCore("oamdev/vela-core:main-3f2a1c", true)}, "main-3f2a1c", true, true},
		{"an image by digest is assumed to have both", []client.Object{velaCore("oamdev/vela-core@sha256:abc", true)}, "", true, true},
		{"no controller found is assumed to have both", nil, "", true, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got := capabilitiesOf(t, tc.objs...)
			assert.Equal(t, tc.version, got.VelaCoreVersion)
			assert.Equal(t, tc.resync, got.ReconcileInterval, "resync interval")
			assert.Equal(t, tc.restart, got.WorkflowRestart, "workflow restart")
		})
	}
}

func TestReconciliationNeedsTheController(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(clientgoscheme.Scheme).WithObjects(velaCore("oamdev/vela-core:v1.10.10", true)).Build()
	svc := &applicationServiceImpl{KubeClient: cli}

	needsNewer := func(err error) {
		t.Helper()
		var b *bcode.Bcode
		require.True(t, errors.As(err, &b), "a bcode: %v", err)
		assert.Equal(t, bcode.ErrNeedsNewerKubeVela.BusinessCode, b.BusinessCode)
		assert.Equal(t, int32(400), b.HTTPCode)
		assert.Contains(t, b.Message, "v1.11.0", "the error names the version needed")
		assert.Contains(t, b.Message, "v1.10.10", "and the version running")
	}
	needsNewer(svc.SetReconcileInterval(ctx, nil, "dev", "5m"))
	needsNewer(svc.RestartWorkflow(ctx, nil, "dev", ""))
}
