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

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/oam"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	discoveryv1 "k8s.io/api/discovery/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apiserver/pkg/endpoints/request"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	"github.com/kubevela/velaux/pkg/server/utils"
)

// endpointsView is service-endpoints-view as vela-core's chart installs it.
const endpointsView = `import "vela/ql"
parameter: {appName: string, appNs: string}
resources: ql.#CollectServiceEndpoints & {app: {name: parameter.appName, namespace: parameter.appNs, filter: {}}}
if resources.err == _|_ {status: endpoints: resources.list}
if resources.err != _|_ {status: error: resources.err}`

// A project's user may list only within its namespaces, as its RoleBindings
// allow, yet its application's Service endpoints are still found.
func TestProjectQueryFindsServiceEndpoints(t *testing.T) {
	ctx := context.Background()
	app := &v1beta1.Application{
		ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "shop-prod", UID: "app-uid", Generation: 1},
		Spec:       v1beta1.ApplicationSpec{Components: []common.ApplicationComponent{{Name: "web", Type: "webservice"}}},
	}
	rt := &v1beta1.ResourceTracker{
		ObjectMeta: metav1.ObjectMeta{Name: "web-shop-prod", Labels: map[string]string{
			oam.LabelAppName: "web", oam.LabelAppNamespace: "shop-prod", oam.LabelAppUID: "app-uid"}},
		Spec: v1beta1.ResourceTrackerSpec{Type: v1beta1.ResourceTrackerTypeRoot, ManagedResources: []v1beta1.ManagedResource{{
			ClusterObjectReference: common.ClusterObjectReference{ObjectReference: corev1.ObjectReference{
				APIVersion: "v1", Kind: "Service", Name: "web", Namespace: "shop-prod"}},
			OAMObjectReference: common.OAMObjectReference{Component: "web"},
		}}},
	}
	svc := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "shop-prod", UID: "svc-uid"},
		Spec:       corev1.ServiceSpec{Type: corev1.ServiceTypeClusterIP, Ports: []corev1.ServicePort{{Name: "http", Port: 80, Protocol: corev1.ProtocolTCP}}},
	}
	slice := &discoveryv1.EndpointSlice{
		ObjectMeta: metav1.ObjectMeta{Name: "web-abcde", Namespace: "shop-prod",
			OwnerReferences: []metav1.OwnerReference{{APIVersion: "v1", Kind: "Service", Name: "web", UID: "svc-uid"}}},
		AddressType: discoveryv1.AddressTypeIPv4,
	}
	viewCM := &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: "service-endpoints-view", Namespace: "vela-system"},
		Data: map[string]string{"template": endpointsView}}

	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(app, rt, svc, slice, viewCM).
		WithInterceptorFuncs(interceptor.Funcs{
			List: func(ctx context.Context, c client.WithWatch, list client.ObjectList, opts ...client.ListOption) error {
				o := &client.ListOptions{}
				o.ApplyOptions(opts)
				if _, asUser := request.UserFrom(ctx); asUser && o.Namespace == "" {
					return apierrors.NewForbidden(schema.GroupResource{Resource: "list"}, "", assert.AnError)
				}
				return c.List(ctx, list, opts...)
			},
		}).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	require.NoError(t, store.Add(ctx, &model.Project{Name: "shop"}))
	require.NoError(t, store.Add(ctx, &model.Env{Name: "prod", Project: "shop", Namespace: "shop-prod"}))
	v := &velaQLServiceImpl{Store: store, ServerKubeClient: cli}

	resp, err := v.QueryView(utils.WithUsername(ctx, "shop-dev"), `service-endpoints-view{appNs=shop-prod, appName=web}.status`, "shop")
	require.NoError(t, err)
	out, _ := json.Marshal(resp)
	assert.Contains(t, string(out), `"host":"web.shop-prod"`, "the Service's endpoint: %s", out)
}
