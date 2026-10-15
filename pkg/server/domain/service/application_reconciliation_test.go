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
	"time"

	"github.com/kubevela/pkg/controller/reconciler"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// The status says whether the controller is skipping the Application.
func TestApplicationStatusFromReportsPaused(t *testing.T) {
	paused, err := applicationStatusFrom(application(t, `{
		"apiVersion": "core.oam.dev/v1beta1", "kind": "Application",
		"metadata": {"name": "shop", "labels": {"controller.core.oam.dev/pause": "true"}},
		"status": {"status": "running"}}`))
	require.NoError(t, err)
	require.True(t, paused.Paused)

	running, err := applicationStatusFrom(application(t, `{
		"apiVersion": "core.oam.dev/v1beta1", "kind": "Application",
		"metadata": {"name": "shop", "labels": {"controller.core.oam.dev/pause": "false"}},
		"status": {"status": "running"}}`))
	require.NoError(t, err)
	require.False(t, running.Paused)
}

// Pausing adds the label and resuming removes it, leaving every other label alone.
func TestSetApplicationPaused(t *testing.T) {
	ctx := context.Background()
	app := &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{
		Name: "shop", Namespace: "prod", Labels: map[string]string{"team": "orders"},
	}}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(app).Build()
	key := types.NamespacedName{Namespace: "prod", Name: "shop"}

	require.NoError(t, setApplicationPaused(ctx, cli, key, true))
	got := &v1beta1.Application{}
	require.NoError(t, cli.Get(ctx, key, got))
	require.Equal(t, map[string]string{"team": "orders", reconciler.LabelPause: "true"}, got.Labels)

	require.NoError(t, setApplicationPaused(ctx, cli, key, false))
	require.NoError(t, cli.Get(ctx, key, got))
	require.Equal(t, map[string]string{"team": "orders"}, got.Labels)
}

// An environment that has never been deployed has no Application to pause.
func TestSetApplicationPausedNotDeployed(t *testing.T) {
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	err := setApplicationPaused(context.Background(), cli, types.NamespacedName{Namespace: "prod", Name: "shop"}, true)
	require.ErrorIs(t, err, bcode.ErrApplicationNotDeployed)
}

// The status carries the reconciliation settings set on the Application.
func TestApplicationStatusFromReportsReconciliation(t *testing.T) {
	status, err := applicationStatusFrom(application(t, `{
		"apiVersion": "core.oam.dev/v1beta1", "kind": "Application",
		"metadata": {"name": "shop", "annotations": {
			"app.oam.dev/reconcile-interval": "5m",
			"app.oam.dev/restart-workflow": "1h",
			"app.oam.dev/autoUpdate": "true"}},
		"status": {"status": "running", "workflowRestartScheduledAt": "2026-10-01T20:00:00Z"}}`))
	require.NoError(t, err)
	require.Equal(t, "5m", status.ReconcileInterval)
	require.Equal(t, "1h", status.RestartWorkflow)
	require.True(t, status.AutoUpdate)
	require.NotNil(t, status.WorkflowRestartScheduledAt)
}

func TestValidReconcileInterval(t *testing.T) {
	for _, ok := range []string{"", "10s", "5m", "1h30m"} {
		require.NoError(t, validReconcileInterval(ok), ok)
	}
	for _, bad := range []string{"5", "9s", "-1m", "soon"} {
		require.ErrorIs(t, validReconcileInterval(bad), bcode.ErrInvalidReconcileInterval, bad)
	}
}

func TestRestartSchedule(t *testing.T) {
	for in, want := range map[string]string{
		"":                     "true",
		"2026-10-01T20:00:00Z": "2026-10-01T20:00:00Z",
		"1h":                   "1h",
	} {
		got, err := restartSchedule(in)
		require.NoError(t, err, in)
		require.Equal(t, want, got, in)
	}
	for _, bad := range []string{"tomorrow", "0s", "-5m", "2026-10-01 20:00"} {
		_, err := restartSchedule(bad)
		require.ErrorIs(t, err, bcode.ErrInvalidRestartSchedule, bad)
	}
}

// Setting an annotation leaves the others alone, and clearing it removes it.
func TestPatchApplicationAnnotation(t *testing.T) {
	ctx := context.Background()
	app := &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{
		Name: "shop", Namespace: "prod", Annotations: map[string]string{"owner": "orders"},
	}}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(app).Build()
	key := types.NamespacedName{Namespace: "prod", Name: "shop"}

	interval := "5m"
	require.NoError(t, patchApplicationMetadata(ctx, cli, key, "annotations", oam.AnnotationReconcileInterval, &interval))
	got := &v1beta1.Application{}
	require.NoError(t, cli.Get(ctx, key, got))
	require.Equal(t, map[string]string{"owner": "orders", oam.AnnotationReconcileInterval: "5m"}, got.Annotations)

	require.NoError(t, patchApplicationMetadata(ctx, cli, key, "annotations", oam.AnnotationReconcileInterval, nil))
	require.NoError(t, cli.Get(ctx, key, got))
	require.Equal(t, map[string]string{"owner": "orders"}, got.Annotations)
}

// KubeVela restarts from status.workflowRestartScheduledAt, so cancelling clears
// it as well as the annotation that scheduled it.
func TestCancelWorkflowRestart(t *testing.T) {
	ctx := context.Background()
	app := &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{
		Name: "shop", Namespace: "prod",
		Annotations: map[string]string{oam.AnnotationWorkflowRestart: "10m", "owner": "orders"},
	}}
	app.Status.WorkflowRestartScheduledAt = &metav1.Time{Time: time.Date(2026, 10, 1, 20, 0, 0, 0, time.UTC)}
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(app).WithStatusSubresource(app).Build()
	key := types.NamespacedName{Namespace: "prod", Name: "shop"}

	require.NoError(t, cancelWorkflowRestart(ctx, cli, key))
	got := &v1beta1.Application{}
	require.NoError(t, cli.Get(ctx, key, got))
	require.Equal(t, map[string]string{"owner": "orders"}, got.Annotations)
	require.Nil(t, got.Status.WorkflowRestartScheduledAt)
}
