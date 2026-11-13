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
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/yaml"

	velatypes "github.com/oam-dev/kubevela/apis/types"

	"github.com/kubevela/velaux/pkg/server/domain/model"
)

// The login page reads the Dex config before anyone signs in, so what it returns is public: the
// issuer, client and redirect the browser sees anyway, never the client's secret.
func TestTheDexConfigCarriesNoClientSecret(t *testing.T) {
	scheme := runtime.NewScheme()
	require.NoError(t, corev1.AddToScheme(scheme))
	cli := fake.NewClientBuilder().WithScheme(scheme).Build()
	secret, err := initDexConfig(context.Background(), cli, "http://velaux.example.com")
	require.NoError(t, err)
	stored := &model.DexConfig{}
	require.NoError(t, yaml.Unmarshal(secret.Data[secretDexConfigKey], stored))
	require.NotEmpty(t, stored.StaticClients[0].Secret)

	got, err := (&authenticationServiceImpl{KubeClient: cli}).GetDexConfig(context.Background())
	require.NoError(t, err)
	body, err := json.Marshal(got)
	require.NoError(t, err)
	require.NotContains(t, string(body), "clientSecret")
	require.NotContains(t, string(body), stored.StaticClients[0].Secret)
	require.Equal(t, stored.StaticClients[0].ID, got.ClientID)
}

func dexClientSecret(t *testing.T, cli client.Client) string {
	t.Helper()
	secret := &corev1.Secret{}
	require.NoError(t, cli.Get(context.Background(), types.NamespacedName{Name: dexConfigName, Namespace: velatypes.DefaultKubeVelaNS}, secret))
	stored := &model.DexConfig{}
	require.NoError(t, yaml.Unmarshal(secret.Data[secretDexConfigKey], stored))
	return stored.StaticClients[0].Secret
}

func dexClient(t *testing.T) client.Client {
	t.Helper()
	scheme := runtime.NewScheme()
	require.NoError(t, corev1.AddToScheme(scheme))
	return fake.NewClientBuilder().WithScheme(scheme).Build()
}

// A Dex client secret every install shared would be known to anyone who read the source.
func TestEachInstallGetsItsOwnDexClientSecret(t *testing.T) {
	a, b := dexClient(t), dexClient(t)
	_, err := initDexConfig(context.Background(), a, "http://a.example.com")
	require.NoError(t, err)
	_, err = initDexConfig(context.Background(), b, "http://b.example.com")
	require.NoError(t, err)
	require.NotEqual(t, legacyDexClientSecret, dexClientSecret(t, a))
	require.GreaterOrEqual(t, len(dexClientSecret(t, a)), 32)
	require.NotEqual(t, dexClientSecret(t, a), dexClientSecret(t, b))
}

// An install made before the secret was generated holds the shared one, and is given its own at
// startup; a secret anyone chose is kept.
func TestStartupReplacesTheSharedDexClientSecret(t *testing.T) {
	ctx := context.Background()
	cli := dexClient(t)
	_, err := initDexConfig(ctx, cli, "http://velaux.example.com")
	require.NoError(t, err)
	setDexClientSecret(t, cli, legacyDexClientSecret)

	svc := &authenticationServiceImpl{KubeClient: cli}
	require.NoError(t, svc.Init(ctx))
	rotated := dexClientSecret(t, cli)
	require.NotEqual(t, legacyDexClientSecret, rotated)

	setDexClientSecret(t, cli, "chosen-by-the-operator")
	require.NoError(t, svc.Init(ctx))
	require.Equal(t, "chosen-by-the-operator", dexClientSecret(t, cli))

	require.NoError(t, (&authenticationServiceImpl{KubeClient: dexClient(t)}).Init(ctx), "no Dex config: nothing to do")
}

func setDexClientSecret(t *testing.T, cli client.Client, value string) {
	t.Helper()
	secret := &corev1.Secret{}
	require.NoError(t, cli.Get(context.Background(), types.NamespacedName{Name: dexConfigName, Namespace: velatypes.DefaultKubeVelaNS}, secret))
	stored := &model.DexConfig{}
	require.NoError(t, yaml.Unmarshal(secret.Data[secretDexConfigKey], stored))
	stored.StaticClients[0].Secret = value
	data, err := yaml.Marshal(stored)
	require.NoError(t, err)
	secret.Data[secretDexConfigKey] = data
	require.NoError(t, cli.Update(context.Background(), secret))
}
