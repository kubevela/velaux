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

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// statusesOfApps is each app's status in each environment it is bound to, by
// app name, as GetApplicationStatusFromAllEnvs reports one app's. It reads
// every binding and environment once, and the deployed Applications once per
// namespace they run in, where that one reads them app by app. An app not
// deployed to an environment has no status there.
func (c *applicationServiceImpl) statusesOfApps(ctx context.Context, apps []*model.Application) (map[string][]*apisv1.ApplicationStatusResponse, error) {
	wanted := map[string]bool{}
	for _, app := range apps {
		wanted[app.PrimaryKey()] = true
	}
	envEntities, err := c.Store.List(ctx, &model.Env{}, nil)
	if err != nil {
		return nil, err
	}
	envs := map[string]*model.Env{}
	for _, entity := range envEntities {
		env := entity.(*model.Env)
		envs[env.Name] = env
	}
	bindingEntities, err := c.Store.List(ctx, &model.EnvBinding{}, nil)
	if err != nil {
		return nil, err
	}
	type deployed struct {
		app  string
		env  *model.Env
		name string
	}
	var bound []deployed
	namespaces := map[string]bool{}
	for _, entity := range bindingEntities {
		binding := entity.(*model.EnvBinding)
		if !wanted[binding.AppPrimaryKey] {
			continue
		}
		env, ok := envs[binding.Name]
		if !ok {
			klog.Warningf("application %s is bound to environment %s, which does not exist", binding.AppPrimaryKey, binding.Name)
			continue
		}
		bound = append(bound, deployed{app: binding.AppPrimaryKey, env: env, name: binding.AppDeployName})
		namespaces[env.Namespace] = true
	}

	// listed holds each namespace's Applications by name; a namespace that
	// cannot be listed is left out, and its apps are read one by one.
	listed := map[string]map[string]*unstructured.Unstructured{}
	for ns := range namespaces {
		list := &unstructured.UnstructuredList{}
		list.SetGroupVersionKind(v1beta1.SchemeGroupVersion.WithKind(v1beta1.ApplicationKind + "List"))
		if err := c.KubeClient.List(ctx, list, client.InNamespace(ns)); err != nil {
			klog.V(4).Infof("listing the Applications in %s, reading them one by one: %v", ns, err)
			continue
		}
		byName := map[string]*unstructured.Unstructured{}
		for i := range list.Items {
			byName[list.Items[i].GetName()] = &list.Items[i]
		}
		listed[ns] = byName
	}

	out := map[string][]*apisv1.ApplicationStatusResponse{}
	for _, d := range bound {
		var status *apisv1.ApplicationStatus
		if byName, ok := listed[d.env.Namespace]; ok {
			obj, found := byName[d.name]
			if !found {
				continue
			}
			if status, err = applicationStatusFrom(obj); err != nil {
				klog.Warningf("the status of application %s in %s: %v", d.app, d.env.Name, err)
				continue
			}
		} else {
			status, err = c.applicationStatus(ctx, d.env.Namespace, d.name)
			if apierrors.IsNotFound(err) {
				continue
			}
			if err != nil {
				klog.Warningf("the status of application %s in %s: %v", d.app, d.env.Name, err)
				continue
			}
		}
		out[d.app] = append(out[d.app], &apisv1.ApplicationStatusResponse{EnvName: d.env.Name, Status: status})
	}
	return out, nil
}
