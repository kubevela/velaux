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
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/yaml"

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
