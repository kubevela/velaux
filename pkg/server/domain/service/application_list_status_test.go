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
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// listStatusFixture: the user may not list Applications in the unlistable
// namespaces, though it may read each. shop has environments prod (namespace shop) and dev
// (namespace shop-dev). cart runs in both, web in prod only, draft nowhere.
func listStatusFixture(t *testing.T, unlistable ...string) (*applicationServiceImpl, []*model.Application, *int, *int) {
	t.Helper()
	ctx := context.Background()
	app := func(ns, name string, phase common.ApplicationPhase) *v1beta1.Application {
		return &v1beta1.Application{
			ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns},
			Status:     common.AppStatus{Phase: phase},
		}
	}
	gets, lists := 0, 0
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).
		WithObjects(app("shop", "cart", common.ApplicationRunning), app("shop-dev", "cart", common.ApplicationWorkflowFailed), app("shop", "web", common.ApplicationRunning)).
		WithStatusSubresource(&v1beta1.Application{}).
		WithInterceptorFuncs(interceptor.Funcs{
			Get: func(ctx context.Context, c client.WithWatch, key client.ObjectKey, obj client.Object, opts ...client.GetOption) error {
				if key.Namespace != "kubevela" {
					gets++
				}
				return c.Get(ctx, key, obj, opts...)
			},
			List: func(ctx context.Context, c client.WithWatch, list client.ObjectList, opts ...client.ListOption) error {
				o := &client.ListOptions{}
				o.ApplyOptions(opts)
				if o.Namespace != "kubevela" {
					lists++
				}
				for _, ns := range unlistable {
					if o.Namespace == ns {
						return apierrors.NewForbidden(schema.GroupResource{Group: "core.oam.dev", Resource: "applications"}, "", assert.AnError)
					}
				}
				return c.List(ctx, list, opts...)
			},
		}).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	apps := []*model.Application{{Name: "cart", Project: "shop"}, {Name: "web", Project: "shop"}, {Name: "draft", Project: "shop"}}
	for _, e := range []datastore.Entity{
		&model.Project{Name: "shop"},
		&model.Env{Name: "prod", Project: "shop", Namespace: "shop"},
		&model.Env{Name: "dev", Project: "shop", Namespace: "shop-dev"},
		&model.EnvBinding{AppPrimaryKey: "cart", Name: "prod", AppDeployName: "cart"},
		&model.EnvBinding{AppPrimaryKey: "cart", Name: "dev", AppDeployName: "cart"},
		&model.EnvBinding{AppPrimaryKey: "web", Name: "prod", AppDeployName: "web"},
		&model.EnvBinding{AppPrimaryKey: "draft", Name: "dev", AppDeployName: "draft"},
		apps[0], apps[1], apps[2],
	} {
		require.NoError(t, store.Add(ctx, e))
	}
	envService := &envServiceImpl{Store: store, KubeClient: cli}
	svc := &applicationServiceImpl{
		Store:             store,
		KubeClient:        cli,
		EnvService:        envService,
		EnvBindingService: &envBindingServiceImpl{Store: store, EnvService: envService},
	}
	return svc, apps, &gets, &lists
}

func TestStatusesOfApps(t *testing.T) {
	ctx := context.Background()
	svc, apps, gets, lists := listStatusFixture(t)

	t.Run("each app's statuses are what the one-app path reports", func(t *testing.T) {
		batched, err := svc.statusesOfApps(ctx, apps)
		require.NoError(t, err)
		for _, app := range apps {
			one, err := svc.GetApplicationStatusFromAllEnvs(ctx, app)
			require.NoError(t, err)
			assert.ElementsMatch(t, envPhases(one), envPhases(batched[app.Name]), app.Name)
		}
		assert.Empty(t, batched["draft"], "an app not deployed has no status")
	})

	t.Run("the cluster is read once per namespace, not once per app and environment", func(t *testing.T) {
		*gets, *lists = 0, 0
		_, err := svc.statusesOfApps(ctx, apps)
		require.NoError(t, err)
		assert.Equal(t, 0, *gets)
		assert.Equal(t, 2, *lists, "shop and shop-dev")
	})
}

func TestStatusesOfAppsReadsOneByOneWhereItCannotList(t *testing.T) {
	ctx := context.Background()
	svc, apps, gets, _ := listStatusFixture(t, "shop-dev")
	*gets = 0
	batched, err := svc.statusesOfApps(ctx, apps)
	require.NoError(t, err)
	assert.ElementsMatch(t, []string{"prod:running", "dev:workflowFailed"}, envPhases(batched["cart"]))
	assert.Equal(t, 2, *gets, "cart and draft in shop-dev, one by one")
}

func envPhases(statuses []*apisv1.ApplicationStatusResponse) []string {
	var out []string
	for _, s := range statuses {
		out = append(out, s.EnvName+":"+string(s.Status.Phase))
	}
	return out
}
