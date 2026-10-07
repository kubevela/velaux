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
	k8stypes "k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
)

func TestBuiltinAction(t *testing.T) {
	installed := func(src string) *corev1.ConfigMap {
		return &corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Annotations: map[string]string{builtinHashAnnotation: hashOf(src)}},
			Data:       map[string]string{reportTemplateKey: src},
		}
	}
	for name, c := range map[string]struct {
		record *model.BuiltinReport
		cm     *corev1.ConfigMap
		want   builtinAction
	}{
		"never installed, no ConfigMap":                      {nil, nil, builtinCreate},
		"never installed, an admin's ConfigMap has its name": {nil, &corev1.ConfigMap{}, builtinRecordOnly},
		"installed, then deleted":                            {&model.BuiltinReport{Hash: hashOf("v1")}, nil, builtinLeave},
		"installed, unedited, unchanged":                     {&model.BuiltinReport{Hash: hashOf("v2")}, installed("v2"), builtinLeave},
		"installed, unedited, a newer built-in":              {&model.BuiltinReport{Hash: hashOf("v1")}, installed("v1"), builtinUpgrade},
		"installed, edited by an admin":                      {&model.BuiltinReport{Hash: hashOf("v1")}, func() *corev1.ConfigMap { cm := installed("v1"); cm.Data[reportTemplateKey] = "mine"; return cm }(), builtinLeave},
	} {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, c.want, decideBuiltin(c.record, c.cm, "v2"))
		})
	}
}

func TestInstallBuiltinReports(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	svc := &reportServiceImpl{ServerKubeClient: cli, Store: store}
	get := func(name string) (*corev1.ConfigMap, bool) {
		cm := &corev1.ConfigMap{}
		err := cli.Get(ctx, k8stypes.NamespacedName{Namespace: "vela-system", Name: name}, cm)
		return cm, err == nil
	}

	require.NoError(t, svc.installBuiltins(ctx, map[string]string{"a": "v1", "b": "v1", "c": "v1"}))
	a, ok := get("a")
	require.True(t, ok, "installed")
	assert.Equal(t, "true", a.Labels[reportLabel])
	assert.Equal(t, "v1", a.Data[reportTemplateKey])

	b, _ := get("b")
	require.NoError(t, cli.Delete(ctx, b))
	c, _ := get("c")
	c.Data[reportTemplateKey] = "an admin's"
	require.NoError(t, cli.Update(ctx, c))

	require.NoError(t, svc.installBuiltins(ctx, map[string]string{"a": "v2", "b": "v2", "c": "v2"}))
	a, _ = get("a")
	assert.Equal(t, "v2", a.Data[reportTemplateKey], "an unedited built-in is upgraded")
	_, ok = get("b")
	assert.False(t, ok, "a deleted built-in stays deleted")
	c, _ = get("c")
	assert.Equal(t, "an admin's", c.Data[reportTemplateKey], "an edited built-in is the admin's")
}

func TestRetireBuiltinReports(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	svc := &reportServiceImpl{ServerKubeClient: cli, Store: store}
	exists := func(name string) bool {
		return cli.Get(ctx, k8stypes.NamespacedName{Namespace: "vela-system", Name: name}, &corev1.ConfigMap{}) == nil
	}

	require.NoError(t, svc.installBuiltins(ctx, map[string]string{"kept": "v1", "old": "v1", "old-edited": "v1"}))
	edited := &corev1.ConfigMap{}
	require.NoError(t, cli.Get(ctx, k8stypes.NamespacedName{Namespace: "vela-system", Name: "old-edited"}, edited))
	edited.Data[reportTemplateKey] = "an admin's"
	require.NoError(t, cli.Update(ctx, edited))

	require.NoError(t, svc.installBuiltins(ctx, map[string]string{"kept": "v1"}))
	assert.True(t, exists("kept"))
	assert.False(t, exists("old"), "a retired built-in, unedited, is removed")
	assert.True(t, exists("old-edited"), "a retired built-in an admin edited is theirs")
	err = store.Get(ctx, &model.BuiltinReport{Name: "old-edited"})
	assert.ErrorIs(t, err, datastore.ErrRecordNotExist, "and VelaUX no longer tracks it")
}
