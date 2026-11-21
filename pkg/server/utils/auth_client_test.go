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

package utils

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/endpoints/request"
	corev1ac "k8s.io/client-go/applyconfigurations/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	"github.com/kubevela/velaux/pkg/features"
)

func TestAuthClientAppliesAsTheUser(t *testing.T) {
	require.NoError(t, features.APIServerMutableFeatureGate.Set("EnableImpersonation=true"))
	t.Cleanup(func() { _ = features.APIServerMutableFeatureGate.Set("EnableImpersonation=false") })

	var seen []string
	record := func(ctx context.Context) error {
		if u, ok := request.UserFrom(ctx); ok {
			seen = append(seen, u.GetName())
		} else {
			seen = append(seen, "velaux")
		}
		return nil
	}
	base := fake.NewClientBuilder().WithInterceptorFuncs(interceptor.Funcs{
		Apply: func(ctx context.Context, _ client.WithWatch, _ runtime.ApplyConfiguration, _ ...client.ApplyOption) error {
			return record(ctx)
		},
		SubResourceApply: func(ctx context.Context, _ client.Client, _ string, _ runtime.ApplyConfiguration, _ ...client.SubResourceApplyOption) error {
			return record(ctx)
		},
	}).Build()

	cli := NewAuthClient(base)
	ctx := WithUsername(context.Background(), "alice")
	require.NoError(t, cli.Apply(ctx, corev1ac.Pod("web", "shop")))
	require.NoError(t, cli.Status().Apply(ctx, corev1ac.Pod("web", "shop")))
	assert.Equal(t, []string{"alice", "alice"}, seen)
}
