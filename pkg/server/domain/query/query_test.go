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

package query

import (
	"context"
	"testing"

	"cuelang.org/go/cue"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apiserver/pkg/authentication/user"
	"k8s.io/apiserver/pkg/endpoints/request"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
)

func TestImportsAllowed(t *testing.T) {
	assert.NoError(t, checkImports("import (\n\"vela/ql\"\n\"strings\"\n)\nx: 1"))
	assert.NoError(t, checkImports("import \"vela/op\"\nx: 1"), "vela/op, as KubeVela's application-revision-view imports it")
	for _, path := range []string{"vela/kube", "vela/http", "example.com/pkg"} {
		assert.Error(t, checkImports("import \""+path+"\"\nx: 1"), path)
	}
}

func rt(name, appNamespace string) *v1beta1.ResourceTracker {
	return &v1beta1.ResourceTracker{ObjectMeta: metav1.ObjectMeta{Name: name, Labels: map[string]string{
		oam.LabelAppName: "app", oam.LabelAppNamespace: appNamespace,
	}}}
}

// asUser records whether each call carried a user, and refuses cluster-scoped
// reads made as one, as Kubernetes does for a project's group.
func asUser(t *testing.T, seen *[]string) client.Client {
	t.Helper()
	forbid := func(kind string, ctx context.Context, err error) error {
		if u, ok := request.UserFrom(ctx); ok {
			*seen = append(*seen, kind+":"+u.GetName())
			if kind == "ResourceTracker" || kind == "Namespace" {
				return apierrors.NewForbidden(schema.GroupResource{Resource: kind}, "", err)
			}
		} else {
			*seen = append(*seen, kind+":velaux")
		}
		return nil
	}
	kindOf := func(obj client.Object) string {
		switch obj.(type) {
		case *v1beta1.ResourceTracker:
			return "ResourceTracker"
		case *corev1.Namespace:
			return "Namespace"
		}
		return "Pod"
	}
	listKindOf := func(list client.ObjectList) string {
		switch list.(type) {
		case *v1beta1.ResourceTrackerList:
			return "ResourceTracker"
		case *corev1.NamespaceList:
			return "Namespace"
		case *corev1.ConfigMapList:
			return "ConfigMap"
		}
		return "Pod"
	}
	return fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(
		rt("app-shop", "shop"), rt("app-other", "other"),
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "shop"}},
		&corev1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "shop"}},
	).WithInterceptorFuncs(interceptor.Funcs{
		Get: func(ctx context.Context, c client.WithWatch, key client.ObjectKey, obj client.Object, opts ...client.GetOption) error {
			if err := forbid(kindOf(obj), ctx, assert.AnError); err != nil {
				return err
			}
			return c.Get(ctx, key, obj, opts...)
		},
		List: func(ctx context.Context, c client.WithWatch, list client.ObjectList, opts ...client.ListOption) error {
			if err := forbid(listKindOf(list), ctx, assert.AnError); err != nil {
				return err
			}
			return c.List(ctx, list, opts...)
		},
	}).Build()
}

func TestGuard(t *testing.T) {
	var seen []string
	g := Guard(asUser(t, &seen), []string{"shop"})
	ctx := request.WithUser(context.Background(), &user.DefaultInfo{Name: "shop-dev"})

	t.Run("an Application's ResourceTrackers in the project are read as VelaUX", func(t *testing.T) {
		seen = nil
		list := &v1beta1.ResourceTrackerList{}
		require.NoError(t, g.List(ctx, list, client.MatchingLabels{oam.LabelAppName: "app", oam.LabelAppNamespace: "shop"}))
		require.Len(t, list.Items, 1)
		assert.Equal(t, []string{"ResourceTracker:velaux"}, seen)
		require.NoError(t, g.Get(ctx, client.ObjectKey{Name: "app-shop"}, &v1beta1.ResourceTracker{}))
	})

	t.Run("another project's are refused", func(t *testing.T) {
		err := g.List(ctx, &v1beta1.ResourceTrackerList{}, client.MatchingLabels{oam.LabelAppName: "app", oam.LabelAppNamespace: "other"})
		assert.True(t, apierrors.IsForbidden(err))
		err = g.Get(ctx, client.ObjectKey{Name: "app-other"}, &v1beta1.ResourceTracker{})
		assert.True(t, apierrors.IsNotFound(err))
	})

	t.Run("a list not naming an Application's namespace is refused", func(t *testing.T) {
		err := g.List(ctx, &v1beta1.ResourceTrackerList{})
		assert.True(t, apierrors.IsForbidden(err))
	})

	t.Run("namespaces are listed as VelaUX", func(t *testing.T) {
		seen = nil
		require.NoError(t, g.List(ctx, &corev1.NamespaceList{}))
		assert.Equal(t, []string{"Namespace:velaux"}, seen)
	})

	t.Run("the resource topology rules are listed as VelaUX, other ConfigMaps as the user", func(t *testing.T) {
		seen = nil
		require.NoError(t, g.List(ctx, &corev1.ConfigMapList{}, client.InNamespace("vela-system"), client.HasLabels{oam.LabelResourceRules}))
		require.NoError(t, g.List(ctx, &corev1.ConfigMapList{}, client.InNamespace("vela-system")))
		require.NoError(t, g.List(ctx, &corev1.ConfigMapList{}, client.InNamespace("shop"), client.HasLabels{oam.LabelResourceRules}))
		assert.Equal(t, []string{"ConfigMap:velaux", "ConfigMap:shop-dev", "ConfigMap:shop-dev"}, seen)
	})

	t.Run("everything else is read as the user", func(t *testing.T) {
		seen = nil
		require.NoError(t, g.Get(ctx, client.ObjectKey{Namespace: "shop", Name: "web"}, &corev1.Pod{}))
		assert.Equal(t, []string{"Pod:shop-dev"}, seen)
	})

	t.Run("it never writes", func(t *testing.T) {
		pod := &corev1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "shop"}}
		assert.ErrorIs(t, g.Delete(ctx, pod), ErrReadOnly)
		assert.ErrorIs(t, g.Create(ctx, pod), ErrReadOnly)
		assert.ErrorIs(t, g.Update(ctx, pod), ErrReadOnly)
	})
}

func TestRun(t *testing.T) {
	var seen []string
	cli := asUser(t, &seen)
	ctx := context.Background()

	t.Run("a view reads through vela/ql", func(t *testing.T) {
		view := `import "vela/ql"
parameter: {name: string}
pod: ql.#Read & {value: {apiVersion: "v1", kind: "Pod", metadata: {name: parameter.name, namespace: "shop"}}}
status: {found: pod.value.metadata.name}`
		v, err := Run(ctx, view, Query{Parameter: map[string]interface{}{"name": "web"}, Export: "status"}, cli, nil)
		require.NoError(t, err)
		found, err := v.LookupPath(cue.ParsePath("found")).String()
		require.NoError(t, err)
		assert.Equal(t, "web", found)
	})

	t.Run("a view cannot write", func(t *testing.T) {
		view := `import "vela/ql"
gone: ql.#Delete & {value: {apiVersion: "v1", kind: "Pod", metadata: {name: "web", namespace: "shop"}}}
status: gone`
		_, err := Run(ctx, view, Query{Export: "status"}, cli, nil)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "delete", "refused for want of a delete function")
		assert.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: "shop", Name: "web"}, &corev1.Pod{}), "the pod is still there")
	})

	t.Run("a view reads through vela/op", func(t *testing.T) {
		view := `import "vela/op"
parameter: {name: string}
pod: op.#Read & {value: {apiVersion: "v1", kind: "Pod", metadata: {name: parameter.name, namespace: "shop"}}}
status: {found: pod.value.metadata.name}`
		v, err := Run(ctx, view, Query{Parameter: map[string]interface{}{"name": "web"}, Export: "status"}, cli, nil)
		require.NoError(t, err)
		found, err := v.LookupPath(cue.ParsePath("found")).String()
		require.NoError(t, err)
		assert.Equal(t, "web", found)
	})

	t.Run("a view cannot write through vela/op", func(t *testing.T) {
		view := `import "vela/op"
applied: op.#Apply & {value: {apiVersion: "v1", kind: "ConfigMap", metadata: {name: "written", namespace: "shop"}}}
status: applied`
		_, err := Run(ctx, view, Query{Export: "status"}, cli, nil)
		require.Error(t, err)
		assert.True(t, apierrors.IsNotFound(cli.Get(ctx, client.ObjectKey{Namespace: "shop", Name: "written"}, &corev1.ConfigMap{})), "nothing was written")
	})

	t.Run("a view importing anything but vela/ql or vela/op is refused before it compiles", func(t *testing.T) {
		_, err := Run(ctx, "import \"vela/kube\"\nstatus: 1", Query{Export: "status"}, cli, nil)
		assert.ErrorIs(t, err, ErrImport)
	})
}
