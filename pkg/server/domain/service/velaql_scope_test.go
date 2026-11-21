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
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apiserver/pkg/endpoints/request"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// podView reads a pod by namespace and name. A read Kubernetes refuses leaves
// found empty and says why in err, as vela/ql reports a failed read.
const podView = `import "vela/ql"
parameter: {namespace: string, name: string}
pod: ql.#Read & {value: {apiVersion: "v1", kind: "Pod", metadata: {name: parameter.name, namespace: parameter.namespace}}}
status: {
	found: *pod.value.metadata.resourceVersion | ""
	err:   *pod.err | ""
	scope: "%s"
}`

func view(namespace, name, scope string) *corev1.ConfigMap {
	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
		Data:       map[string]string{"template": podViewFor(scope)},
	}
}

func podViewFor(scope string) string {
	return fmt.Sprintf(podView, scope)
}

// velaQLFixture is project shop (namespace shop, environment prod in
// shop-prod) and project other (namespace other). The shop project's group
// may read shop and shop-prod and nothing else, as its RoleBindings allow.
func velaQLFixture(t *testing.T, reads *[]string) *velaQLServiceImpl {
	t.Helper()
	ctx := context.Background()
	pod := func(ns string) *corev1.Pod {
		return &corev1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: ns}}
	}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(
		view("vela-system", "pod-view", "global"), view("vela-system", "only-global", "global"),
		view("shop", "pod-view", "project"),
		pod("shop-prod"), pod("other"),
	).WithInterceptorFuncs(interceptor.Funcs{
		Get: func(ctx context.Context, c client.WithWatch, key client.ObjectKey, obj client.Object, opts ...client.GetOption) error {
			if key.Namespace == "kubevela" || key.Namespace == "" {
				// The datastore's own records.
				return c.Get(ctx, key, obj, opts...)
			}
			as := "velaux"
			if u, ok := request.UserFrom(ctx); ok {
				as = u.GetGroups()[0]
				if key.Namespace != "shop" && key.Namespace != "shop-prod" {
					*reads = append(*reads, key.Namespace+"/"+key.Name+":"+as+":refused")
					return apierrors.NewForbidden(schema.GroupResource{Resource: "pods"}, key.Name, assert.AnError)
				}
			}
			*reads = append(*reads, key.Namespace+"/"+key.Name+":"+as)
			return c.Get(ctx, key, obj, opts...)
		},
	}).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	for _, e := range []datastore.Entity{
		&model.Project{Name: "shop"},
		&model.Project{Name: "other"},
		&model.Env{Name: "prod", Project: "shop", Namespace: "shop-prod"},
	} {
		require.NoError(t, store.Add(ctx, e))
	}
	return &velaQLServiceImpl{Store: store, ServerKubeClient: cli}
}

func TestQueryViewInProject(t *testing.T) {
	var reads []string
	v := velaQLFixture(t, &reads)
	ctx := utils.WithUsername(context.Background(), "shop-dev")

	t.Run("a project's view wins over a global one, and reads as the project", func(t *testing.T) {
		reads = nil
		resp, err := v.QueryView(ctx, `pod-view{namespace=shop-prod,name=web}.status`, "shop")
		require.NoError(t, err)
		assert.Equal(t, "project", (*resp)["scope"])
		assert.NotEmpty(t, (*resp)["found"])
		assert.Equal(t, []string{"shop/pod-view:kubevela:project:shop", "shop-prod/web:kubevela:project:shop"}, reads)
	})

	t.Run("a global view is read as VelaUX, and still runs as the project", func(t *testing.T) {
		reads = nil
		resp, err := v.QueryView(ctx, `only-global{namespace=shop-prod,name=web}.status`, "shop")
		require.NoError(t, err)
		assert.Equal(t, "global", (*resp)["scope"])
		assert.Contains(t, reads, "vela-system/only-global:velaux")
		assert.Contains(t, reads, "shop-prod/web:kubevela:project:shop")
	})

	t.Run("another project's resources are refused", func(t *testing.T) {
		resp, err := v.QueryView(ctx, `pod-view{namespace=other,name=web}.status`, "shop")
		require.NoError(t, err)
		assert.Empty(t, (*resp)["found"])
		assert.Contains(t, (*resp)["err"], "forbidden")
	})

	t.Run("an unknown view is not found", func(t *testing.T) {
		_, err := v.QueryView(ctx, `no-such-view{name=web}.status`, "shop")
		assert.Equal(t, bcode.ErrViewNotFound, err)
	})

	t.Run("an unknown project is refused", func(t *testing.T) {
		_, err := v.QueryView(ctx, `pod-view{namespace=shop-prod,name=web}.status`, "nope")
		assert.Equal(t, bcode.ErrProjectIsNotExist, err)
	})
}

func TestQueryViewForEveryProject(t *testing.T) {
	var reads []string
	v := velaQLFixture(t, &reads)
	resp, err := v.QueryView(context.Background(), `pod-view{namespace=other,name=web}.status`, "")
	require.NoError(t, err)
	assert.Equal(t, "global", (*resp)["scope"], "only global views without a project")
	assert.Equal(t, []string{"vela-system/pod-view:velaux", "other/web:velaux"}, reads)
}
