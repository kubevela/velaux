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
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	pkgaddon "github.com/oam-dev/kubevela/pkg/addon"

	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

func TestUpdateAddonRegistryKeepsCredentials(t *testing.T) {
	ctx := context.Background()
	setup := func(t *testing.T, registry pkgaddon.Registry) (addonServiceImpl, pkgaddon.RegistryDataStore, client.Client) {
		cli := fake.NewClientBuilder().WithScheme(clientgoscheme.Scheme).Build()
		ds := pkgaddon.NewRegistryDataStore(cli)
		require.NoError(t, ds.AddRegistry(ctx, registry))
		return addonServiceImpl{RegistryDS: ds}, ds, cli
	}

	t.Run("an edit without the token keeps it", func(t *testing.T) {
		svc, ds, cli := setup(t, pkgaddon.Registry{Name: "private", Git: &pkgaddon.GitAddonSource{URL: "https://github.com/example/addons", Path: "addons", Token: "ghp_old"}})
		_, err := svc.UpdateAddonRegistry(ctx, "private", apis.UpdateAddonRegistryRequest{Git: &pkgaddon.GitAddonSource{URL: "https://github.com/example/addons", Path: "catalog"}})
		require.NoError(t, err)
		got, err := ds.GetRegistry(ctx, "private")
		require.NoError(t, err)
		assert.Equal(t, "catalog", got.Git.Path)
		assert.Equal(t, "ghp_old", got.Git.Token)

		// Stored as KubeVela stores it: a reference to the Secret, the token in the Secret.
		var cm corev1.ConfigMap
		require.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "vela-addon-registry"}, &cm))
		assert.Contains(t, cm.Data["registries"], `"tokenSecretRef":"addon-registry-private"`)
		assert.NotContains(t, cm.Data["registries"], "ghp_old")
		var secret corev1.Secret
		require.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "addon-registry-private"}, &secret))
		assert.Equal(t, "ghp_old", string(secret.Data["token"]))
	})

	t.Run("a new token replaces the old one", func(t *testing.T) {
		svc, ds, _ := setup(t, pkgaddon.Registry{Name: "private", Git: &pkgaddon.GitAddonSource{URL: "https://github.com/example/addons", Token: "ghp_old"}})
		_, err := svc.UpdateAddonRegistry(ctx, "private", apis.UpdateAddonRegistryRequest{Git: &pkgaddon.GitAddonSource{URL: "https://github.com/example/addons", Token: "ghp_new"}})
		require.NoError(t, err)
		got, err := ds.GetRegistry(ctx, "private")
		require.NoError(t, err)
		assert.Equal(t, "ghp_new", got.Git.Token)
	})

	t.Run("an edit without Helm credentials keeps them", func(t *testing.T) {
		svc, ds, _ := setup(t, pkgaddon.Registry{Name: "charts", Helm: &pkgaddon.HelmSource{URL: "https://charts.example.com", Username: "bot", Password: "s3cret"}})
		_, err := svc.UpdateAddonRegistry(ctx, "charts", apis.UpdateAddonRegistryRequest{Helm: &pkgaddon.HelmSource{URL: "https://charts.example.com/stable"}})
		require.NoError(t, err)
		got, err := ds.GetRegistry(ctx, "charts")
		require.NoError(t, err)
		assert.Equal(t, "https://charts.example.com/stable", got.Helm.URL)
		assert.Equal(t, "bot", got.Helm.Username)
		assert.Equal(t, "s3cret", got.Helm.Password)
	})

	t.Run("a registry changing kind carries nothing over", func(t *testing.T) {
		svc, ds, _ := setup(t, pkgaddon.Registry{Name: "moved", Git: &pkgaddon.GitAddonSource{URL: "https://github.com/example/addons", Token: "ghp_old"}})
		_, err := svc.UpdateAddonRegistry(ctx, "moved", apis.UpdateAddonRegistryRequest{Gitlab: &pkgaddon.GitlabAddonSource{URL: "https://gitlab.example.com", Repo: "addons"}})
		require.NoError(t, err)
		got, err := ds.GetRegistry(ctx, "moved")
		require.NoError(t, err)
		require.NotNil(t, got.Gitlab)
		assert.Empty(t, got.Gitlab.Token)
	})
}
