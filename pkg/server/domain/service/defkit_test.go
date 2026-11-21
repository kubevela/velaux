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

	workflowv1alpha1 "github.com/kubevela/workflow/api/v1alpha1"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1alpha1"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func withSteps(app *v1beta1.Application, phases ...string) *v1beta1.Application {
	app.Status.Workflow = &common.WorkflowStatus{}
	for i, name := range []string{defkitRenderStep, defkitReviewStep, defkitApplyStep} {
		if i < len(phases) {
			app.Status.Workflow.Steps = append(app.Status.Workflow.Steps, workflowv1alpha1.WorkflowStepStatus{
				StepStatus: workflowv1alpha1.StepStatus{Name: name, Type: name, Phase: workflowv1alpha1.WorkflowStepPhase(phases[i])},
			})
		}
	}
	return app
}

func TestDefKitPhase(t *testing.T) {
	src := apisv1.DefKitSource{Git: "https://example.com/defs", Version: "main"}
	for _, tc := range []struct {
		phases []string
		want   string
	}{
		{nil, defkitPhaseRendering},
		{[]string{"running"}, defkitPhaseRendering},
		{[]string{"failed"}, defkitPhaseFailed},
		{[]string{"succeeded", "suspending"}, defkitPhaseReview},
		{[]string{"succeeded", "succeeded"}, defkitPhaseApplying},
		{[]string{"succeeded", "succeeded", "running"}, defkitPhaseApplying},
		{[]string{"succeeded", "succeeded", "succeeded"}, defkitPhaseApplied},
		{[]string{"succeeded", "succeeded", "failed"}, defkitPhaseFailed},
	} {
		app := defkitApplication("defs", src, apisv1.DefKitSettings{})
		if tc.phases != nil {
			withSteps(app, tc.phases...)
		}
		got, _ := defkitPhase(app)
		assert.Equal(t, tc.want, got, "%v", tc.phases)
	}

	app := withSteps(defkitApplication("defs", src, apisv1.DefKitSettings{}), "succeeded", "succeeded", "succeeded")
	app.Generation, app.Status.ObservedGeneration = 2, 1
	got, _ := defkitPhase(app)
	assert.Equal(t, defkitPhaseRendering, got, "a spec the controller has not seen yet is a new render")
}

func TestDefKitSourceRoundTrips(t *testing.T) {
	src := apisv1.DefKitSource{Git: "https://example.com/defs", Version: "v1", Prefix: "dk-", Types: []string{"trait"}}
	app := defkitApplication("defs", src, apisv1.DefKitSettings{})
	assert.Equal(t, src, defkitSourceOf(app))
	assert.Equal(t, apisv1.DefKitSettings{}, defkitSettingsOf(app))
	assert.Equal(t, "defkit-defs", app.Name)
	assert.Equal(t, "defs", app.Labels[defkitModuleLabel])
	assert.Equal(t, types.FromInner, app.Labels[types.LabelSourceOfTruth], "a module is not a service")
	for _, p := range app.Spec.Policies {
		assert.NotEqual(t, "take-over", p.Type, "a module adopts only the conflicts a review picks, never by policy")
	}
}

func installedDefinition(kind, name, description string, labels map[string]string) *v1beta1.TraitDefinition {
	return &v1beta1.TraitDefinition{
		TypeMeta: metav1.TypeMeta{APIVersion: "core.oam.dev/v1beta1", Kind: kind},
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: "vela-system", Labels: labels,
			Annotations: map[string]string{"definition.oam.dev/description": description}},
		Spec: v1beta1.TraitDefinitionSpec{Schematic: &common.Schematic{CUE: &common.CUE{Template: "patch: {}"}}},
	}
}

func renderedDefinition(name, description string) map[string]interface{} {
	return map[string]interface{}{
		"apiVersion": "core.oam.dev/v1beta1", "kind": "TraitDefinition",
		"metadata": map[string]interface{}{"name": name,
			"annotations": map[string]interface{}{"definition.oam.dev/description": description}},
		"spec": map[string]interface{}{"schematic": map[string]interface{}{"cue": map[string]interface{}{"template": "patch: {}"}}},
	}
}

// reviewFixture is a module in review: its render renders a new, a changed,
// an unchanged and a conflicting trait, and no longer renders one it installed.
func reviewFixture(t *testing.T) (*defkitServiceImpl, client.Client) {
	t.Helper()
	src := apisv1.DefKitSource{Git: "https://example.com/defs", Version: "main"}
	app := withSteps(defkitApplication("defs", src, apisv1.DefKitSettings{}), "succeeded", "suspending")
	owned := map[string]string{oam.LabelAppName: "defkit-defs", oam.LabelAppNamespace: "vela-system", "oam.dev/render-hash": "x"}

	module, _ := json.Marshal(map[string]interface{}{"name": "defs", "version": "v0.0.0-abc", "source": src})
	defs, _ := json.Marshal([]map[string]interface{}{
		renderedDefinition("fresh", "new one"),
		renderedDefinition("edited", "after"),
		renderedDefinition("same", "same"),
		renderedDefinition("taken", "theirs"),
	})
	render := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "defkit-defs-abc", Namespace: defkitRenderNamespace,
			Labels:      map[string]string{defkitModuleLabel: "defkit-defs"},
			Annotations: map[string]string{defkitRenderedAt: "2026-10-02T01:00:00Z"}},
		Data: map[string]string{defkitKeyModule: string(module), defkitKeyDefinitions: string(defs), defkitKeyErrors: "[]"},
	}
	stale := render.DeepCopy()
	stale.Name = "defkit-defs-old"
	staleModule, _ := json.Marshal(map[string]interface{}{"name": "defs", "source": apisv1.DefKitSource{Git: "https://example.com/defs", Version: "v0"}})
	stale.Data = map[string]string{defkitKeyModule: string(staleModule), defkitKeyDefinitions: "[]"}
	stale.Annotations = map[string]string{defkitRenderedAt: "2026-10-02T02:00:00Z"}

	rt := &v1beta1.ResourceTracker{
		ObjectMeta: metav1.ObjectMeta{Name: "defkit-defs-v1-vela-system", Labels: map[string]string{
			oam.LabelAppName: "defkit-defs", oam.LabelAppNamespace: "vela-system",
		}},
		Spec: v1beta1.ResourceTrackerSpec{Type: v1beta1.ResourceTrackerTypeVersioned},
	}
	for _, name := range []string{"edited", "same", "gone"} {
		rt.Spec.ManagedResources = append(rt.Spec.ManagedResources, v1beta1.ManagedResource{ClusterObjectReference: common.ClusterObjectReference{
			ObjectReference: corev1.ObjectReference{APIVersion: "core.oam.dev/v1beta1", Kind: "TraitDefinition", Namespace: "vela-system", Name: name},
		}})
	}
	rt.Spec.ManagedResources = append(rt.Spec.ManagedResources, v1beta1.ManagedResource{ClusterObjectReference: common.ClusterObjectReference{
		ObjectReference: corev1.ObjectReference{APIVersion: "batch/v1", Kind: "Job", Namespace: defkitRenderNamespace, Name: "defkit-defs-abc"},
	}})
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(app, render, stale, rt,
		installedDefinition("TraitDefinition", "edited", "before", owned),
		installedDefinition("TraitDefinition", "same", "same", owned),
		installedDefinition("TraitDefinition", "taken", "theirs", map[string]string{"app.kubernetes.io/managed-by": "Helm"}),
		installedDefinition("TraitDefinition", "gone", "old", owned),
	).WithStatusSubresource(app).Build()
	return &defkitServiceImpl{KubeClient: cli}, cli
}

func TestDefKitPreview(t *testing.T) {
	svc, _ := reviewFixture(t)
	preview, err := svc.PreviewModule(context.Background(), "defs")
	require.NoError(t, err)
	assert.Equal(t, defkitPhaseReview, preview.Phase)
	require.NotNil(t, preview.Info)
	assert.Equal(t, "v0.0.0-abc", preview.Info.ResolvedVersion, "the render of the current source, not a newer one of another")

	got := map[string]string{}
	for _, item := range preview.Items {
		got[item.Name] = item.Status
	}
	assert.Equal(t, map[string]string{
		"fresh": defkitNew, "edited": defkitChanged, "same": defkitUnchanged, "taken": defkitConflict, "gone": defkitRemoved,
	}, got)
	for _, item := range preview.Items {
		if item.Name == "edited" {
			assert.Contains(t, item.Current, "before")
			assert.Contains(t, item.Next, "after")
			assert.NotContains(t, item.Current, oam.LabelAppName, "what KubeVela stamps is not part of the diff")
		}
		if item.Name == "taken" {
			assert.NotContains(t, item.Current, "meta.helm.sh", "nor what Helm stamps")
			assert.NotContains(t, item.Current, "managed-by")
		}
	}
}

func TestDefKitDetailShowsItsApplication(t *testing.T) {
	svc, _ := reviewFixture(t)
	detail, err := svc.DetailModule(context.Background(), "defs")
	require.NoError(t, err)
	require.NotNil(t, detail.Application)
	assert.Equal(t, "defkit-defs", detail.Application.Name)
	assert.Equal(t, "vela-system", detail.Application.Namespace)

	var steps []string
	for _, st := range detail.Application.Steps {
		steps = append(steps, st.Name+":"+st.Phase)
	}
	assert.Equal(t, []string{"render:succeeded", "review:suspending"}, steps, "the workflow as far as it has run")

	var kinds []string
	for _, r := range detail.Application.Resources {
		kinds = append(kinds, r.Kind+"/"+r.Name)
	}
	assert.Contains(t, kinds, "Job/defkit-defs-abc", "everything the module tracks, its render Jobs too")
	assert.Contains(t, kinds, "TraitDefinition/edited")
	assert.Len(t, detail.Definitions, 3, "Definitions keeps to the definitions")
}

func TestDefKitApplyPreview(t *testing.T) {
	svc, cli := reviewFixture(t)
	ctx := context.Background()
	require.NoError(t, svc.ApplyPreview(ctx, "defs", apisv1.ApplyDefKitPreviewRequest{
		Delete: []string{"TraitDefinition/gone", "TraitDefinition/same"},
	}))

	err := cli.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "gone"}, &v1beta1.TraitDefinition{})
	assert.True(t, apierrors.IsNotFound(err), "a ticked removed definition is deleted")
	assert.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "same"}, &v1beta1.TraitDefinition{}),
		"only removed definitions can be deleted this way")

	app := &v1beta1.Application{}
	require.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "defkit-defs"}, app))
	assert.False(t, app.Status.Workflow.Suspend, "the review step is resumed")

	taken := &v1beta1.TraitDefinition{}
	require.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "taken"}, taken))
	assert.Empty(t, taken.Labels[oam.LabelAppName], "a conflict not taken over is left unowned, so the apply cannot overwrite it")

	svc2, cli2 := reviewFixture(t)
	require.NoError(t, svc2.ApplyPreview(ctx, "defs", apisv1.ApplyDefKitPreviewRequest{TakeOver: []string{"TraitDefinition/taken"}}))
	require.NoError(t, cli2.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "taken"}, taken))
	assert.Equal(t, "defkit-defs", taken.Labels[oam.LabelAppName], "a conflict taken over is adopted by the module")
	assert.NoError(t, cli2.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "gone"}, &v1beta1.TraitDefinition{}),
		"an unticked removed definition is kept")
}

func TestDefKitApplyNeedsReview(t *testing.T) {
	svc, cli := reviewFixture(t)
	ctx := context.Background()
	app := &v1beta1.Application{}
	require.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "defkit-defs"}, app))
	withSteps(app, "running")
	require.NoError(t, cli.Status().Update(ctx, app))
	assert.Equal(t, bcode.ErrDefKitNotInReview, svc.ApplyPreview(ctx, "defs", apisv1.ApplyDefKitPreviewRequest{}))
}

func storedGCPolicy(t *testing.T, app *v1beta1.Application) (bool, []map[string]interface{}) {
	t.Helper()
	for _, p := range app.Spec.Policies {
		if p.Type == "garbage-collect" {
			var gc struct {
				KeepLegacyResource bool                     `json:"keepLegacyResource"`
				Rules              []map[string]interface{} `json:"rules"`
			}
			require.NoError(t, json.Unmarshal(p.Properties.Raw, &gc))
			return gc.KeepLegacyResource, gc.Rules
		}
	}
	t.Fatal("no garbage-collect policy")
	return false, nil
}

func TestDefKitDeletionPolicy(t *testing.T) {
	src := apisv1.DefKitSource{Git: "https://example.com/defs"}
	keep, rules := storedGCPolicy(t, defkitApplication("defs", src, apisv1.DefKitSettings{}))
	assert.False(t, keep, "the rules decide what outlives an update")
	require.Len(t, rules, 1)
	assert.Equal(t, "never", rules[0]["strategy"], "a module retains its definitions by default")

	_, rules = storedGCPolicy(t, defkitApplication("defs", src, apisv1.DefKitSettings{
		DeletionPolicy: "delete",
		Overrides:      map[string]string{"TraitDefinition/keep-me": "retain", "TraitDefinition/a": "retain", "PolicyDefinition/b": "delete"},
	}))
	require.Len(t, rules, 3)
	assert.Equal(t, map[string]interface{}{
		"selector": map[string]interface{}{"resourceTypes": []interface{}{"PolicyDefinition"}, "resourceNames": []interface{}{"b"}},
		"strategy": "onAppUpdate",
	}, rules[0], "overrides come first, one rule per kind and strategy, names sorted")
	assert.Equal(t, map[string]interface{}{
		"selector": map[string]interface{}{"resourceTypes": []interface{}{"TraitDefinition"}, "resourceNames": []interface{}{"a", "keep-me"}},
		"strategy": "never",
	}, rules[1])
	assert.Equal(t, "onAppUpdate", rules[2]["strategy"], "then the module's own")
}

func TestDefKitAutoUpdate(t *testing.T) {
	src := apisv1.DefKitSource{Git: "https://example.com/defs", Version: "main"}
	manual := defkitApplication("defs", src, apisv1.DefKitSettings{})
	assert.Empty(t, manual.Annotations[oam.AnnotationWorkflowRestart])
	assert.Len(t, manual.Spec.Workflow.Steps, 3)

	auto := defkitApplication("defs", src, apisv1.DefKitSettings{AutoUpdate: true})
	assert.Equal(t, "10m", auto.Annotations[oam.AnnotationWorkflowRestart], "every 10 minutes unless told otherwise")
	var names []string
	for _, s := range auto.Spec.Workflow.Steps {
		names = append(names, s.Name)
	}
	assert.Equal(t, []string{defkitRenderStep, defkitApplyStep}, names, "an auto-updating module applies without review")

	auto = defkitApplication("defs", src, apisv1.DefKitSettings{AutoUpdate: true, Interval: "2h"})
	assert.Equal(t, "2h", auto.Annotations[oam.AnnotationWorkflowRestart])
	assert.Equal(t, apisv1.DefKitSettings{AutoUpdate: true, Interval: "2h"}, defkitSettingsOf(auto), "settings round-trip")

	for _, bad := range []apisv1.DefKitSettings{
		{DeletionPolicy: "sometimes"},
		{Overrides: map[string]string{"TraitDefinition/x": "maybe"}},
		{AutoUpdate: true, Interval: "soon"},
		{AutoUpdate: true, Interval: "10s"},
		{AutoUpdate: true, Interval: "1m"},
		{AutoUpdate: true, Interval: "4m59s"},
	} {
		assert.Equal(t, bcode.ErrDefKitInvalidSettings, validateDefKitSettings(bad), "%+v", bad)
	}
	assert.NoError(t, validateDefKitSettings(apisv1.DefKitSettings{DeletionPolicy: "delete", AutoUpdate: true, Interval: "5m"}))
	assert.NoError(t, validateDefKitSettings(apisv1.DefKitSettings{Interval: "1m"}), "an interval is only checked when auto update is on")
}

func TestDefKitEffectivePolicy(t *testing.T) {
	svc, cli := reviewFixture(t)
	ctx := context.Background()
	app := &v1beta1.Application{}
	require.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: "vela-system", Name: "defkit-defs"}, app))
	app.Annotations = map[string]string{defkitSettingsAnnotation: `{"deletionPolicy":"delete","overrides":{"TraitDefinition/same":"retain"}}`}
	require.NoError(t, cli.Update(ctx, app))

	detail, err := svc.DetailModule(ctx, "defs")
	require.NoError(t, err)
	got := map[string]string{}
	for _, d := range detail.Definitions {
		got[d.Name] = d.Policy
	}
	assert.Equal(t, map[string]string{"edited": "delete", "same": "retain", "gone": "delete"}, got)

	preview, err := svc.PreviewModule(ctx, "defs")
	require.NoError(t, err)
	for _, item := range preview.Items {
		if item.Name == "gone" {
			assert.Equal(t, "delete", item.Policy, "a removal says what applying does with it")
		}
	}
}

func TestDefKitRepositories(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	svc := &defkitServiceImpl{KubeClient: cli}
	repos, err := svc.ListRepositories(ctx)
	require.NoError(t, err)
	assert.Empty(t, repos.Repositories, "none offered without the addon's settings")

	require.NoError(t, cli.Create(ctx, &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: defkitSettingsConfigMap, Namespace: defkitRenderNamespace},
		Data:       map[string]string{"repositories": `[{"name":"KubeVela definitions","git":"https://github.com/kubevela/vela-go-definitions","version":"main"}]`},
	}))
	repos, err = svc.ListRepositories(ctx)
	require.NoError(t, err)
	require.Len(t, repos.Repositories, 1)
	assert.Equal(t, "https://github.com/kubevela/vela-go-definitions", repos.Repositories[0].Git)
}

func TestDefKitCreateNeedsAddonAndOneSource(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	svc := &defkitServiceImpl{KubeClient: cli}
	_, err := svc.CreateModule(ctx, apisv1.CreateDefKitModuleRequest{Name: "defs", DefKitSource: apisv1.DefKitSource{Git: "x"}})
	assert.Equal(t, bcode.ErrDefKitAddonDisabled, err)

	for _, name := range []string{defkitRenderStepType, defkitApplyStepType} {
		require.NoError(t, cli.Create(ctx, &v1beta1.WorkflowStepDefinition{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: "vela-system"}}))
	}
	_, err = svc.CreateModule(ctx, apisv1.CreateDefKitModuleRequest{Name: "defs", DefKitSource: apisv1.DefKitSource{Git: "x", Ref: "y"}})
	assert.Equal(t, bcode.ErrDefKitNoSource, err)
	m, err := svc.CreateModule(ctx, apisv1.CreateDefKitModuleRequest{Name: "defs", DefKitSource: apisv1.DefKitSource{Git: "x"}})
	require.NoError(t, err)
	assert.Equal(t, defkitPhaseRendering, m.Phase)
	_, err = svc.CreateModule(ctx, apisv1.CreateDefKitModuleRequest{Name: "defs", DefKitSource: apisv1.DefKitSource{Git: "x"}})
	assert.Equal(t, bcode.ErrDefKitModuleExist, err)
}

func TestDefkitApplicationLeavesFinishedRenderJobsGone(t *testing.T) {
	src := apisv1.DefKitSource{Ref: "example.com/defs", Version: "v1"}
	for _, settings := range []apisv1.DefKitSettings{{}, {AutoUpdate: true, Interval: "10m"}} {
		app := defkitApplication("defs", src, settings)
		var policy *v1alpha1.ApplyOncePolicySpec
		for _, p := range app.Spec.Policies {
			if p.Type == v1alpha1.ApplyOncePolicyType {
				policy = &v1alpha1.ApplyOncePolicySpec{}
				require.NoError(t, json.Unmarshal(p.Properties.Raw, policy))
			}
		}
		require.NotNil(t, policy, "an apply-once policy, so KubeVela does not recreate a render Job its TTL deleted")
		assert.True(t, policy.Enable)
		job := &unstructured.Unstructured{}
		job.SetAPIVersion("batch/v1")
		job.SetKind("Job")
		strategy := policy.FindStrategy(job)
		require.NotNil(t, strategy, "it covers Jobs")
		assert.Equal(t, []string{"*"}, strategy.Path)
		assert.Equal(t, v1alpha1.ApplyOnceStrategyOnAppStateKeep, strategy.ApplyOnceAffectStrategy)
		cm := &unstructured.Unstructured{}
		cm.SetAPIVersion("v1")
		cm.SetKind("ConfigMap")
		assert.Nil(t, policy.FindStrategy(cm), "and only Jobs")
	}
}
