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
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
)

func TestDefaultEnvNamespace(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "shop"}},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "legacy", Labels: map[string]string{oam.LabelNamespaceOfEnvName: "made-elsewhere"}}},
	).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	for _, e := range []datastore.Entity{
		&model.Project{Name: "shop"},
		&model.Project{Name: "taken", Namespace: "shop"},
		&model.Project{Name: "legacy", Namespace: "legacy"},
		&model.Project{Name: "fresh", Namespace: "fresh-ns"},
	} {
		require.NoError(t, store.Add(ctx, e))
	}
	p := &envServiceImpl{Store: store, KubeClient: cli}

	t.Run("a project's first environment takes the project's namespace", func(t *testing.T) {
		ns, err := p.defaultEnvNamespace(ctx, "shop", "production")
		require.NoError(t, err)
		assert.Equal(t, "shop", ns)
		ns, err = p.defaultEnvNamespace(ctx, "fresh", "staging")
		require.NoError(t, err)
		assert.Equal(t, "fresh-ns", ns, "a namespace not created yet is free")
	})

	t.Run("once an environment holds it, the next takes its own name", func(t *testing.T) {
		require.NoError(t, store.Add(ctx, &model.Env{Name: "production", Project: "shop", Namespace: "shop"}))
		ns, err := p.defaultEnvNamespace(ctx, "shop", "dev")
		require.NoError(t, err)
		assert.Equal(t, "dev", ns)
		ns, err = p.defaultEnvNamespace(ctx, "taken", "qa")
		require.NoError(t, err)
		assert.Equal(t, "qa", ns, "another project's environment holds it too")
	})

	t.Run("a namespace bound to an environment VelaUX does not know is held", func(t *testing.T) {
		ns, err := p.defaultEnvNamespace(ctx, "legacy", "qa")
		require.NoError(t, err)
		assert.Equal(t, "qa", ns)
	})
}
