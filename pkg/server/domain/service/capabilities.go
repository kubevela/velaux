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
	"strings"

	"github.com/Masterminds/semver/v3"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam"
	appsv1 "k8s.io/api/apps/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// reconciliationSince is the first KubeVela whose controller honours the
// resync interval and workflow restart annotations.
var reconciliationSince = semver.MustParse("v1.11.0")

// controllerCapabilities is what the cluster's vela-core can do, read from its
// image tag the way an addon's system requirements are. A version that cannot
// be read, such as a branch build or an image by digest, is assumed to have
// every capability.
func controllerCapabilities(ctx context.Context, cli client.Client) apisv1.ControllerCapabilities {
	tag := velaCoreImageTag(ctx, cli)
	caps := apisv1.ControllerCapabilities{VelaCoreVersion: tag, ReconcileInterval: true, WorkflowRestart: true}
	v, err := semver.NewVersion(tag)
	if err != nil || !v.LessThan(reconciliationSince) {
		return caps
	}
	caps.ReconcileInterval, caps.WorkflowRestart = false, false
	return caps
}

// velaCoreImageTag is the image tag of the vela-core controller, or empty when
// there is none to read.
func velaCoreImageTag(ctx context.Context, cli client.Client) string {
	deploys := &appsv1.DeploymentList{}
	if err := cli.List(ctx, deploys, client.MatchingLabels{oam.LabelControllerName: oam.ApplicationControllerName}); err != nil {
		return ""
	}
	if len(deploys.Items) == 0 {
		// Charts before the controller label name the Deployment instead.
		d := appsv1.Deployment{}
		if err := cli.Get(ctx, client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: types.KubeVelaControllerDeployment}, &d); err != nil {
			return ""
		}
		deploys.Items = append(deploys.Items, d)
	}
	for _, c := range deploys.Items[0].Spec.Template.Spec.Containers {
		if c.Name != types.DefaultKubeVelaReleaseName || strings.Contains(c.Image, "@") {
			continue
		}
		if i := strings.LastIndex(c.Image, ":"); i > strings.LastIndex(c.Image, "/") {
			return c.Image[i+1:]
		}
	}
	return ""
}

// needsReconciliation refuses a reconciliation setting the controller would
// not honour.
func needsReconciliation(ctx context.Context, cli client.Client, has func(apisv1.ControllerCapabilities) bool) error {
	caps := controllerCapabilities(ctx, cli)
	if has(caps) {
		return nil
	}
	return bcode.ErrNeedsNewerKubeVela.SetMessage(fmt.Sprintf(
		"this needs KubeVela %s or later; the cluster runs %s", reconciliationSince.Original(), caps.VelaCoreVersion))
}
