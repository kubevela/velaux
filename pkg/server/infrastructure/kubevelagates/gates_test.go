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

package kubevelagates

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/component-base/featuregate"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func newGate(t *testing.T) featuregate.MutableFeatureGate {
	gate := featuregate.NewFeatureGate()
	require.NoError(t, gate.Add(map[featuregate.Feature]featuregate.FeatureSpec{
		"Inheritance": {Default: false},
		"ApplyOnce":   {Default: false},
	}))
	return gate
}

func TestApply(t *testing.T) {
	gate := newGate(t)
	unknown := apply(gate, map[string]string{"Inheritance": "true", "ApplyOnce": "maybe", "NewerThanUs": "true"})
	assert.True(t, gate.Enabled("Inheritance"), "a gate both know is the controller's")
	assert.False(t, gate.Enabled("ApplyOnce"), "a value that is not a bool leaves the gate, not the others")
	assert.Equal(t, []string{"NewerThanUs"}, unknown, "a gate this KubeVela does not know is skipped")
}

func TestSync(t *testing.T) {
	ctx := context.Background()
	gate := newGate(t)

	t.Run("no ConfigMap leaves the defaults", func(t *testing.T) {
		syncer := &Syncer{Reader: fake.NewClientBuilder().Build(), Namespace: "vela-system", Gate: gate}
		require.NoError(t, syncer.Sync(ctx))
		assert.False(t, gate.Enabled("Inheritance"))
	})

	t.Run("the published gates are applied, and a later change too", func(t *testing.T) {
		cm := &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: ConfigMapName, Namespace: "vela-system"}, Data: map[string]string{"Inheritance": "true"}}
		cli := fake.NewClientBuilder().WithObjects(cm).Build()
		syncer := &Syncer{Reader: cli, Namespace: "vela-system", Gate: gate}
		require.NoError(t, syncer.Sync(ctx))
		assert.True(t, gate.Enabled("Inheritance"))

		cm.Data["Inheritance"] = "false"
		require.NoError(t, cli.Update(ctx, cm))
		require.NoError(t, syncer.Sync(ctx))
		assert.False(t, gate.Enabled("Inheritance"))
	})
}
