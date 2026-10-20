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
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/types"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func TestCustomisationKeepsBrandingWhenTerminologyIsNotJSON(t *testing.T) {
	ctx := context.Background()
	cm := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: CustomisationConfigMapName, Namespace: types.DefaultKubeVelaNS},
		Data: map[string]string{
			"pageTitle":    "Acme Platform",
			"logoURL":      "https://example.com/logo.svg",
			"sidebarColor": "#e6f1f6",
			"accentColor":  "#00739d",
			"terminology":  "{Application: Service}",
		},
	}
	svc := &customisationServiceImpl{KubeClient: fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(cm).Build()}

	got, err := svc.Get(ctx)
	require.NoError(t, err, "one bad key must not turn off all branding")
	assert.Equal(t, "Acme Platform", got.PageTitle)
	assert.Equal(t, "https://example.com/logo.svg", got.LogoURL)
	assert.Equal(t, "#e6f1f6", got.SidebarColor)
	assert.Equal(t, "#00739d", got.AccentColor)
	assert.Empty(t, got.Terminology)
	assert.Contains(t, got.TerminologyError, "could not be read")
}

func TestCustomisationIgnoresTerminologyOfTheWrongShapeWhole(t *testing.T) {
	ctx := context.Background()
	cm := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: CustomisationConfigMapName, Namespace: types.DefaultKubeVelaNS},
		Data: map[string]string{
			"pageTitle":   "Acme Platform",
			"terminology": `{"Application":{"singular":"Service","plural":"Services"},"Cluster":5}`,
		},
	}
	svc := &customisationServiceImpl{KubeClient: fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(cm).Build()}

	got, err := svc.Get(ctx)
	require.NoError(t, err)
	assert.Equal(t, "Acme Platform", got.PageTitle)
	assert.Empty(t, got.Terminology, "no term is half-applied from terminology that cannot be read")
	assert.Contains(t, got.TerminologyError, "could not be read")
}

func TestCustomisationUpdateNeverStoresTheTerminologyError(t *testing.T) {
	ctx := context.Background()
	svc := &customisationServiceImpl{KubeClient: fake.NewClientBuilder().WithScheme(common2.Scheme).Build()}
	saved, err := svc.Update(ctx, apisv1.Customisation{PageTitle: "Acme", TerminologyError: "stale"})
	require.NoError(t, err)
	assert.Empty(t, saved.TerminologyError)
	got, err := svc.Get(ctx)
	require.NoError(t, err)
	assert.Empty(t, got.TerminologyError)
}

// userFixture is a user alice in a datastore whose login type is loginType.
func userFixture(t *testing.T, loginType string) (*userServiceImpl, *model.User) {
	t.Helper()
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	hash, err := GeneratePasswordHash("Original123")
	require.NoError(t, err)
	user := &model.User{Name: "alice", Alias: "Alice", Password: hash}
	require.NoError(t, store.Add(ctx, user))
	require.NoError(t, store.Add(ctx, &model.SystemInfo{InstallID: "test", LoginType: loginType}))
	return &userServiceImpl{Store: store, K8sClient: cli, SysService: systemInfoServiceImpl{Store: store, KubeClient: cli}}, user
}

func storedPassword(t *testing.T, svc *userServiceImpl, name string) string {
	t.Helper()
	user := &model.User{Name: name}
	require.NoError(t, svc.Store.Get(context.Background(), user))
	return user.Password
}

func TestDexRefusesAPasswordReset(t *testing.T) {
	ctx := context.Background()

	t.Run("dex: a password change is refused, and nothing is stored", func(t *testing.T) {
		svc, user := userFixture(t, model.LoginTypeDex)
		before := storedPassword(t, svc, "alice")
		_, err := svc.UpdateUser(ctx, user, apisv1.UpdateUserRequest{Password: "Changed12345"})
		var got *bcode.Bcode
		require.True(t, errors.As(err, &got), "got %v", err)
		assert.Equal(t, bcode.ErrUserCannotModified.BusinessCode, got.BusinessCode)
		assert.Equal(t, before, storedPassword(t, svc, "alice"))
	})

	t.Run("dex: other edits still work", func(t *testing.T) {
		svc, user := userFixture(t, model.LoginTypeDex)
		resp, err := svc.UpdateUser(ctx, user, apisv1.UpdateUserRequest{Alias: "Alice B"})
		require.NoError(t, err)
		assert.Equal(t, "Alice B", resp.Alias)
	})

	t.Run("local: a password change is stored", func(t *testing.T) {
		svc, user := userFixture(t, model.LoginTypeLocal)
		before := storedPassword(t, svc, "alice")
		_, err := svc.UpdateUser(ctx, user, apisv1.UpdateUserRequest{Password: "Changed12345"})
		require.NoError(t, err)
		assert.NotEqual(t, before, storedPassword(t, svc, "alice"))
	})
}
