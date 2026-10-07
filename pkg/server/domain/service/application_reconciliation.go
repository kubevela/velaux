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
	"time"

	"github.com/kubevela/pkg/controller/reconciler"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// minReconcileInterval is the shortest per-Application resync KubeVela honours;
// below it the controller ignores the annotation and uses its default.
const minReconcileInterval = 10 * time.Second

// deployedApplication names the Application an environment's binding deploys.
func (c *applicationServiceImpl) deployedApplication(ctx context.Context, appmodel *model.Application, envName string) (types.NamespacedName, error) {
	env, err := c.EnvService.GetEnv(ctx, envName)
	if err != nil {
		return types.NamespacedName{}, err
	}
	envBinding, err := c.EnvBindingService.GetEnvBinding(ctx, appmodel, envName)
	if err != nil {
		return types.NamespacedName{}, err
	}
	return types.NamespacedName{Namespace: env.Namespace, Name: envBinding.AppDeployName}, nil
}

// SetApplicationPaused pauses or resumes the controller's reconciliation of the
// Application deployed to an environment.
func (c *applicationServiceImpl) SetApplicationPaused(ctx context.Context, appmodel *model.Application, envName string, paused bool) error {
	key, err := c.deployedApplication(ctx, appmodel, envName)
	if err != nil {
		return err
	}
	return setApplicationPaused(ctx, c.KubeClient, key, paused)
}

// SetReconcileInterval sets how often the controller resyncs the Application
// deployed to an environment; an empty interval returns it to the default.
func (c *applicationServiceImpl) SetReconcileInterval(ctx context.Context, appmodel *model.Application, envName string, interval string) error {
	if err := validReconcileInterval(interval); err != nil {
		return err
	}
	key, err := c.deployedApplication(ctx, appmodel, envName)
	if err != nil {
		return err
	}
	var value *string
	if interval != "" {
		value = &interval
	}
	return patchApplicationMetadata(ctx, c.KubeClient, key, "annotations", oam.AnnotationReconcileInterval, value)
}

// RestartWorkflow restarts the workflow of the Application deployed to an
// environment, now, at a time, or after every completion.
func (c *applicationServiceImpl) RestartWorkflow(ctx context.Context, appmodel *model.Application, envName string, schedule string) error {
	value, err := restartSchedule(schedule)
	if err != nil {
		return err
	}
	key, err := c.deployedApplication(ctx, appmodel, envName)
	if err != nil {
		return err
	}
	return patchApplicationMetadata(ctx, c.KubeClient, key, "annotations", oam.AnnotationWorkflowRestart, &value)
}

// CancelWorkflowRestart drops a pending or recurring workflow restart.
func (c *applicationServiceImpl) CancelWorkflowRestart(ctx context.Context, appmodel *model.Application, envName string) error {
	key, err := c.deployedApplication(ctx, appmodel, envName)
	if err != nil {
		return err
	}
	return cancelWorkflowRestart(ctx, c.KubeClient, key)
}

// cancelWorkflowRestart removes the restart annotation, then clears
// status.workflowRestartScheduledAt: KubeVela moves a restart's time into status
// and restarts from there, deleting the annotation outright for a one-off. In
// this order the controller cannot schedule it again from the annotation.
func cancelWorkflowRestart(ctx context.Context, cli client.Client, key types.NamespacedName) error {
	if err := patchApplicationMetadata(ctx, cli, key, "annotations", oam.AnnotationWorkflowRestart, nil); err != nil {
		return err
	}
	obj := &unstructured.Unstructured{}
	obj.SetGroupVersionKind(v1beta1.ApplicationKindVersionKind)
	obj.SetNamespace(key.Namespace)
	obj.SetName(key.Name)
	patch := []byte(`{"status":{"workflowRestartScheduledAt":null}}`)
	return cli.Status().Patch(ctx, obj, client.RawPatch(types.MergePatchType, patch))
}

// validReconcileInterval accepts an empty interval or one KubeVela honours.
func validReconcileInterval(interval string) error {
	if interval == "" {
		return nil
	}
	d, err := time.ParseDuration(interval)
	if err != nil || d < minReconcileInterval {
		return bcode.ErrInvalidReconcileInterval
	}
	return nil
}

// restartSchedule is the restart-workflow annotation for a schedule: True to
// restart now, an RFC3339 time to restart once then, or a positive interval to
// restart after every completion.
func restartSchedule(schedule string) (string, error) {
	if schedule == "" || schedule == True {
		return True, nil
	}
	if _, err := time.Parse(time.RFC3339, schedule); err == nil {
		return schedule, nil
	}
	if d, err := time.ParseDuration(schedule); err == nil && d > 0 {
		return schedule, nil
	}
	return "", bcode.ErrInvalidRestartSchedule
}

// setApplicationPaused sets or removes the controller's pause label on an
// Application.
func setApplicationPaused(ctx context.Context, cli client.Client, key types.NamespacedName, paused bool) error {
	var value *string
	if paused {
		v := reconciler.ValueTrue
		value = &v
	}
	return patchApplicationMetadata(ctx, cli, key, "labels", reconciler.LabelPause, value)
}

// patchApplicationMetadata sets one label or annotation on an Application, or
// removes it when value is nil. It patches that key alone: a VelaUX deploy is a
// three-way apply over the keys VelaUX writes, so it leaves this one in place.
func patchApplicationMetadata(ctx context.Context, cli client.Client, key types.NamespacedName, field, name string, value *string) error {
	var v interface{}
	if value != nil {
		v = *value
	}
	patch, err := json.Marshal(map[string]interface{}{
		"metadata": map[string]interface{}{field: map[string]interface{}{name: v}},
	})
	if err != nil {
		return err
	}
	obj := &unstructured.Unstructured{}
	obj.SetGroupVersionKind(v1beta1.ApplicationKindVersionKind)
	obj.SetNamespace(key.Namespace)
	obj.SetName(key.Name)
	if err := cli.Patch(ctx, obj, client.RawPatch(types.MergePatchType, patch)); err != nil {
		if apierrors.IsNotFound(err) {
			return bcode.ErrApplicationNotDeployed
		}
		return err
	}
	return nil
}
