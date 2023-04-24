/*
 Copyright 2021 The KubeVela Authors.

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

package repository

import (
	"context"

	apierror "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/pkg/multicluster"
	"github.com/oam-dev/kubevela/pkg/oam"
	"github.com/oam-dev/kubevela/pkg/utils"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// CreateTargetNamespace create the namespace of the target
func CreateTargetNamespace(ctx context.Context, k8sClient client.Client, clusterName, namespace, targetName string) error {
	if clusterName == "" || namespace == "" {
		return bcode.ErrTargetInvalidWithEmptyClusterOrNamespace
	}
	return utils.CreateOrUpdateNamespace(multicluster.ContextWithClusterName(ctx, clusterName), k8sClient, namespace, utils.MergeOverrideLabels(map[string]string{
		oam.LabelRuntimeNamespaceUsage: oam.VelaNamespaceUsageTarget,
		oam.LabelNamespaceOfTargetName: targetName,
	}))
}

// DeleteTargetNamespace delete the namespace of the target
func DeleteTargetNamespace(ctx context.Context, k8sClient client.Client, clusterName, namespace, targetName string) error {
	err := utils.UpdateNamespace(multicluster.ContextWithClusterName(ctx, clusterName), k8sClient, namespace,
		utils.MergeOverrideLabels(map[string]string{
			oam.LabelRuntimeNamespaceUsage: "",
			oam.LabelNamespaceOfTargetName: "",
		}))
	if apierror.IsNotFound(err) {
		return nil
	}
	return err
}

// CreateTarget create a target
func CreateTarget(ctx context.Context, ds datastore.DataStore, tg *model.Target) error {
	// check Target name.
	exit, err := ds.IsExist(ctx, tg)
	if err != nil {
		klog.Errorf("check target existence failure %s", err.Error())
		return err
	}
	if exit {
		return bcode.ErrTargetExist
	}

	if err = ds.Add(ctx, tg); err != nil {
		klog.Errorf("add target failure %s", err.Error())
		return err
	}
	return nil
}

// ListTarget list the targets
func ListTarget(ctx context.Context, ds datastore.DataStore, project string, dsOption *datastore.ListOptions) ([]*model.Target, error) {
	if dsOption == nil {
		dsOption = &datastore.ListOptions{}
	}
	target := model.Target{}
	if project != "" {
		target.Project = project
	}
	Targets, err := ds.List(ctx, &target, dsOption)
	if err != nil {
		klog.Errorf("list target err %v", err)
		return nil, err
	}
	var respTargets []*model.Target
	for _, raw := range Targets {
		target, ok := raw.(*model.Target)
		if ok {
			respTargets = append(respTargets, target)
		}
	}
	return respTargets, nil
}
