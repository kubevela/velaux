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

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam"

	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func addonApp(name string, labels map[string]string) *v1beta1.Application {
	return &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{
		Name:      "addon-" + name,
		Namespace: types.DefaultKubeVelaNS,
		Labels:    labels,
	}}
}

func TestAddonManager(t *testing.T) {
	cases := map[string]struct {
		labels map[string]string
		want   *apis.AddonManager
	}{
		"installed by an Application's addon component": {
			labels: map[string]string{oam.LabelAddonName: "netlify", oam.LabelAppName: "platform-addons", oam.LabelAppNamespace: "default"},
			want:   &apis.AddonManager{Name: "platform-addons", Namespace: "default"},
		},
		"enabled directly": {
			labels: map[string]string{oam.LabelAddonName: "netlify"},
		},
		"labelled with itself": {
			labels: map[string]string{oam.LabelAppName: "addon-netlify", oam.LabelAppNamespace: types.DefaultKubeVelaNS},
		},
	}
	for name, c := range cases {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, c.want, addonManager(addonApp("netlify", c.labels)))
		})
	}
}

func TestManagedAddonRefusesChanges(t *testing.T) {
	scheme := runtime.NewScheme()
	require.NoError(t, clientgoscheme.AddToScheme(scheme))
	require.NoError(t, v1beta1.AddToScheme(scheme))
	managed := addonApp("netlify", map[string]string{
		oam.LabelAddonName: "netlify", oam.LabelAppName: "platform-addons", oam.LabelAppNamespace: "default",
	})
	kubeClient := fake.NewClientBuilder().WithScheme(scheme).WithObjects(managed).Build()
	u := &addonServiceImpl{KubeClient: kubeClient}
	ctx := context.Background()

	isManaged := func(t *testing.T, err error) {
		var code *bcode.Bcode
		require.True(t, errors.As(err, &code), "got %v", err)
		assert.Equal(t, bcode.ErrAddonManagedByApplication.BusinessCode, code.BusinessCode)
		assert.Contains(t, code.Message, "default/platform-addons")
	}
	t.Run("disable", func(t *testing.T) { isManaged(t, u.DisableAddon(ctx, "netlify", false)) })
	t.Run("enable", func(t *testing.T) { isManaged(t, u.EnableAddon(ctx, "netlify", apis.EnableAddonRequest{})) })
	t.Run("update", func(t *testing.T) { isManaged(t, u.UpdateAddon(ctx, "netlify", apis.EnableAddonRequest{})) })

	var app v1beta1.Application
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(managed), &app))
	assert.Equal(t, managed.Labels, app.Labels)
}
