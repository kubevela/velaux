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

	"github.com/oam-dev/kubevela/pkg/multicluster"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/klog/v2"
	"sigs.k8s.io/cli-utils/pkg/kstatus/status"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// builtinHealth are the kinds KubeVela's resource tree checks the health of
// itself (CheckResourceStatus in its query provider). It reports every other
// kind healthy without looking, so for those the tree's health is replaced
// with kstatus's reading of the object.
var builtinHealth = map[schema.GroupKind]bool{
	{Group: "", Kind: "Pod"}:                                    true,
	{Group: "", Kind: "Service"}:                                true,
	{Group: "", Kind: "PersistentVolumeClaim"}:                  true,
	{Group: "apps", Kind: "ReplicaSet"}:                         true,
	{Group: "helm.toolkit.fluxcd.io", Kind: "HelmRelease"}:      true,
	{Group: "source.toolkit.fluxcd.io", Kind: "HelmRepository"}: true,
}

// healthSource marks a health kstatus read, so the UI can say where it came
// from.
const healthSource = "kstatus"

// kstatusHealth is an object's health as KubeVela's resource tree states one,
// read by kstatus: current is healthy, in progress or terminating is
// progressing, failed is unhealthy, and anything it cannot tell is unknown.
func kstatusHealth(obj *unstructured.Unstructured) map[string]interface{} {
	result, err := status.Compute(obj)
	if err != nil {
		return map[string]interface{}{"statusCode": "UnKnown", "reason": "kstatus", "message": err.Error(), "source": healthSource}
	}
	code := "UnKnown"
	switch result.Status {
	case status.CurrentStatus:
		code = "Healthy"
	case status.InProgressStatus, status.TerminatingStatus:
		code = "Progressing"
	case status.FailedStatus:
		code = "UnHealthy"
	}
	return map[string]interface{}{"statusCode": code, "reason": string(result.Status), "message": result.Message, "source": healthSource}
}

// objectReader fills in an object, named by its apiVersion, kind, namespace
// and name, from the cluster given.
type objectReader func(ctx context.Context, cluster string, obj *unstructured.Unstructured) error

// applyKStatus replaces the health of every node in a resource tree response
// whose kind KubeVela does not check itself with kstatus's reading of its
// object. A node whose object cannot be read keeps the health it had.
func applyKStatus(ctx context.Context, resp map[string]interface{}, read objectReader) {
	resources, _ := resp["resources"].([]interface{})
	for _, r := range resources {
		res, _ := r.(map[string]interface{})
		if tree, ok := res["resourceTree"].(map[string]interface{}); ok {
			applyKStatusNode(ctx, tree, read)
		}
	}
}

func applyKStatusNode(ctx context.Context, node map[string]interface{}, read objectReader) {
	apiVersion, _ := node["apiVersion"].(string)
	kind, _ := node["kind"].(string)
	name, _ := node["name"].(string)
	gv, err := schema.ParseGroupVersion(apiVersion)
	if err == nil && kind != "" && name != "" && !builtinHealth[schema.GroupKind{Group: gv.Group, Kind: kind}] {
		obj := &unstructured.Unstructured{}
		obj.SetAPIVersion(apiVersion)
		obj.SetKind(kind)
		obj.SetName(name)
		namespace, _ := node["namespace"].(string)
		obj.SetNamespace(namespace)
		cluster, _ := node["cluster"].(string)
		if err := read(ctx, cluster, obj); err != nil {
			klog.V(4).Infof("kstatus: cannot read %s %s/%s on %q: %v", kind, namespace, name, cluster, err)
		} else {
			node["healthStatus"] = kstatusHealth(obj)
		}
	}
	leaves, _ := node["leafNodes"].([]interface{})
	for _, l := range leaves {
		if leaf, ok := l.(map[string]interface{}); ok {
			applyKStatusNode(ctx, leaf, read)
		}
	}
}

// ResourceTreeOptions narrows a resource tree to a component, and to a cluster
// and namespace.
type ResourceTreeOptions struct {
	Component        string
	Cluster          string
	ClusterNamespace string
}

// GetApplicationResourceTree is the resource tree of the Application an
// environment deploys, as the application-resource-tree-view shows it, with
// kstatus health for the kinds KubeVela does not check itself.
func (c *applicationServiceImpl) GetApplicationResourceTree(ctx context.Context, app *model.Application, envName string, opts ResourceTreeOptions) (*apisv1.VelaQLViewResponse, error) {
	deployed, err := c.deployedApplication(ctx, app, envName)
	if err != nil {
		return nil, err
	}
	params := []string{fmt.Sprintf("appNs=%s", deployed.Namespace), fmt.Sprintf("appName=%s", deployed.Name)}
	if opts.Cluster != "" {
		params = append([]string{fmt.Sprintf("cluster=%s", opts.Cluster), fmt.Sprintf("clusterNs=%s", opts.ClusterNamespace)}, params...)
	}
	if opts.Component != "" {
		params = append([]string{fmt.Sprintf("name=%s", opts.Component)}, params...)
	}
	resp, err := c.VelaQLService.QueryView(ctx, fmt.Sprintf("application-resource-tree-view{%s}.status", strings.Join(params, ", ")))
	if err != nil {
		return nil, err
	}
	applyKStatus(ctx, *resp, func(ctx context.Context, cluster string, obj *unstructured.Unstructured) error {
		if cluster == "" {
			cluster = multicluster.ClusterLocalName
		}
		return c.KubeClient.Get(multicluster.ContextWithClusterName(ctx, cluster), client.ObjectKeyFromObject(obj), obj)
	})
	return resp, nil
}
