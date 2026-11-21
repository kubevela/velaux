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
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	autoscalingv1 "k8s.io/api/autoscaling/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apiserver/pkg/endpoints/request"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	apicommon "github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/report"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func reportConfigMap(namespace, name, src string) *corev1.ConfigMap {
	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace, Labels: map[string]string{reportLabel: "true"}},
		Data:       map[string]string{reportTemplateKey: src},
	}
}

const (
	appsReport = `
// +title=%s
import "vela/report"
template: {
	apps: report.#Apps
	rows: [...{
		// +title=Application
		// +link=/applications/{name}/config
		name: string
		// +title=From
		from: string
	}]
	rows: [for a in apps.$returns {name: a.name, from: "%s"}]
}`
	deploymentsReport = `
// +title=Deployments
import "vela/report"
template: {
	parameter: {
		// +usage=Only this one
		name?: string
	}
	d: report.#List & {$params: {apiVersion: "apps/v1", kind: "Deployment"}}
	rows: [...{
		// +title=Name
		name: string
		// +title=Namespace
		namespace: string
	}]
	let want = [if parameter.name != _|_ {parameter.name}, ""][0]
	rows: [for x in d.$returns if want == "" || x.object.metadata.name == want {name: x.object.metadata.name, namespace: x.namespace}]
}`
	componentsReport = `
// +title=Components
import (
	"list"
	"strings"
	"vela/report"
)
template: {
	c:    report.#Components
	defs: report.#Definitions
	versions: {for d in defs.$returns {"\(d.kind)/\(d.name)": d.versions}}
	rows: [...{
		// +title=Component
		component: string
		// +title=Type
		type: string
		// +title=Expressions
		expressions: int
		// +title=Pinned to a missing version
		missing: bool
	}]
	rows: [for x in c.$returns
		let parts = strings.Split(x.type, "@")
		let have = [if versions["\(x.kind)/\(parts[0])"] != _|_ {versions["\(x.kind)/\(parts[0])"]}, []][0] {
			component:   x.component
			type:        x.type
			expressions: [if x.expressions != _|_ {len(x.expressions)}, 0][0]
			missing:     [if len(parts) == 2 {!list.Contains(have, parts[1])}, false][0]
		}]
}`
)

// reportFixture is two projects, shop and other, each with an application, a
// target namespace and a Deployment there; reports local to shop and global
// ones in vela-system. user cannot read vela-system, as a project user who is
// impersonated cannot; server records who each Deployment list ran as.
type reportFixture struct {
	svc      *reportServiceImpl
	listedAs [][]string
}

func newReportFixture(t *testing.T, serverFails bool) *reportFixture {
	t.Helper()
	ctx := context.Background()
	fx := &reportFixture{}
	deploy := func(ns, name, app string) *appsv1.Deployment {
		return &appsv1.Deployment{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns, Labels: map[string]string{"app.oam.dev/name": app}},
			Spec: appsv1.DeploymentSpec{Template: corev1.PodTemplateSpec{Spec: corev1.PodSpec{Containers: []corev1.Container{{Name: "web", Image: "web:1"}}}}}}
	}
	objects := []client.Object{
		deploy("shop-prod", "storefront-web", "storefront"), deploy("other-prod", "secret-api", "secret"),
		reportConfigMap("shop", "apps", fmt.Sprintf(appsReport, "Shop apps", "local")),
		reportConfigMap("vela-system", "apps", fmt.Sprintf(appsReport, "Apps", "global")),
		reportConfigMap("vela-system", "deployments", deploymentsReport),
		reportConfigMap("vela-system", "components", componentsReport),
		reportConfigMap("vela-system", "broken", "template: {"),
		&corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: "not-a-report", Namespace: "vela-system"}, Data: map[string]string{reportTemplateKey: "x: 1"}},
		&v1beta1.DefinitionRevision{ObjectMeta: metav1.ObjectMeta{Name: "webapp-v1", Namespace: "vela-system"},
			Spec: v1beta1.DefinitionRevisionSpec{Revision: 1, DefinitionType: "Component", ComponentDefinition: v1beta1.ComponentDefinition{ObjectMeta: metav1.ObjectMeta{Name: "webapp"}}}},
		&v1beta1.ComponentDefinition{ObjectMeta: metav1.ObjectMeta{Name: "webapp", Namespace: "vela-system"}},
	}
	forbidden := apierrors.NewForbidden(schema.GroupResource{Resource: "configmaps"}, "", errors.New("no"))
	user := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(objects...).WithInterceptorFuncs(interceptor.Funcs{
		Get: func(ctx context.Context, c client.WithWatch, key client.ObjectKey, obj client.Object, opts ...client.GetOption) error {
			if key.Namespace == "vela-system" {
				return forbidden
			}
			return c.Get(ctx, key, obj, opts...)
		},
		List: func(ctx context.Context, c client.WithWatch, list client.ObjectList, opts ...client.ListOption) error {
			if namespaceOf(opts) == "vela-system" {
				return forbidden
			}
			return c.List(ctx, list, opts...)
		},
	}).Build()
	server := fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(objects...).WithInterceptorFuncs(interceptor.Funcs{
		Get: func(ctx context.Context, c client.WithWatch, key client.ObjectKey, obj client.Object, opts ...client.GetOption) error {
			if serverFails && key.Namespace == "vela-system" {
				return forbidden
			}
			return c.Get(ctx, key, obj, opts...)
		},
		List: func(ctx context.Context, c client.WithWatch, list client.ObjectList, opts ...client.ListOption) error {
			if serverFails && namespaceOf(opts) == "vela-system" {
				return forbidden
			}
			if u, ok := list.(interface{ GetKind() string }); ok && u.GetKind() == "DeploymentList" {
				who := []string{"(VelaUX)"}
				if info, ok := request.UserFrom(ctx); ok {
					who = append([]string{info.GetName()}, info.GetGroups()...)
				}
				fx.listedAs = append(fx.listedAs, who)
			}
			return c.List(ctx, list, opts...)
		},
	}).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, server)
	require.NoError(t, err)
	props := model.JSONStruct{"replicas": "$(source.env.scaling.min)"}
	for _, e := range []datastore.Entity{
		&model.Project{Name: "shop", Namespace: "shop"},
		&model.Project{Name: "other", Namespace: "other"},
		&model.Application{Name: "storefront", Project: "shop"},
		&model.Application{Name: "secret", Project: "other"},
		&model.Target{Name: "shop-prod", Project: "shop", Cluster: &model.ClusterTarget{ClusterName: "local", Namespace: "shop-prod"}},
		&model.Target{Name: "other-prod", Project: "other", Cluster: &model.ClusterTarget{ClusterName: "local", Namespace: "other-prod"}},
		&model.ApplicationComponent{AppPrimaryKey: "storefront", Name: "storefront-web", Type: "webapp", Properties: &props,
			Traits: []model.ApplicationTrait{{Type: "cpuscaler@v9"}}},
		&model.ApplicationComponent{AppPrimaryKey: "secret", Name: "secret-api", Type: "webapp", Properties: &props},
	} {
		require.NoError(t, store.Add(ctx, e))
	}
	fx.svc = &reportServiceImpl{KubeClient: user, ServerKubeClient: server, Store: store,
		undeployed: func(context.Context, *model.Application, string) (bool, error) { return false, nil }}
	return fx
}

func namespaceOf(opts []client.ListOption) string {
	o := &client.ListOptions{}
	o.ApplyOptions(opts)
	return o.Namespace
}

func (fx *reportFixture) run(t *testing.T, project, id string, parameters map[string]interface{}) *apisv1.ReportResult {
	t.Helper()
	res, err := fx.svc.RunReport(utils.WithUsername(context.Background(), "alice"), project, id, parameters)
	require.NoError(t, err)
	return res
}

func column(res *apisv1.ReportResult, key string) []interface{} {
	out := []interface{}{}
	for _, row := range res.Rows {
		out = append(out, row.Values[key])
	}
	return out
}

func TestReportCatalogue(t *testing.T) {
	t.Run("local reports, then global ones, a global one hidden by a local one of its name", func(t *testing.T) {
		list, err := newReportFixture(t, false).svc.ListReports(context.Background(), "shop")
		require.NoError(t, err)
		assert.False(t, list.GlobalUnavailable)
		got := map[string]apisv1.ReportMeta{}
		order := []string{}
		for _, r := range list.Reports {
			got[r.Scope+"/"+r.ID] = r
			order = append(order, r.Scope+"/"+r.ID)
		}
		assert.Equal(t, []string{"local/apps", "global/apps", "global/broken", "global/components", "global/deployments"}, order)
		assert.Equal(t, "Shop apps", got["local/apps"].Title)
		assert.True(t, got["global/apps"].Hidden)
		assert.NotEmpty(t, got["global/broken"].Error, "a report that is not one says why")
		require.Len(t, got["global/deployments"].Parameters, 1, "its parameter form")
		assert.Equal(t, "name", got["global/deployments"].Parameters[0].JSONKey)
	})

	t.Run("global reports that cannot be read leave the project's own", func(t *testing.T) {
		list, err := newReportFixture(t, true).svc.ListReports(context.Background(), "shop")
		require.NoError(t, err)
		assert.True(t, list.GlobalUnavailable)
		require.Len(t, list.Reports, 1)
		assert.Equal(t, "local", list.Reports[0].Scope)
	})
}

func TestReportsSeeOnlyTheirProject(t *testing.T) {
	fx := newReportFixture(t, false)

	res := fx.run(t, "shop", "deployments", nil)
	assert.Equal(t, []interface{}{"storefront-web"}, column(res, "name"), "only shop's namespaces")
	assert.Equal(t, [][]string{{"alice", "kubevela:project:shop", "kubevela:client"}}, fx.listedAs, "listed as the project")

	assert.Equal(t, []interface{}{"storefront-web", "storefront-web"}, column(fx.run(t, "shop", "components", nil), "component"))
	assert.Equal(t, []interface{}{"secret"}, column(fx.run(t, "other", "apps", nil), "name"))
}

func TestRunReport(t *testing.T) {
	fx := newReportFixture(t, false)

	t.Run("a local report runs in place of a global one of its name", func(t *testing.T) {
		res := fx.run(t, "shop", "apps", nil)
		assert.Equal(t, []interface{}{"local"}, column(res, "from"))
		assert.Equal(t, "local", res.Report.Scope)
		assert.Equal(t, "/applications/storefront/config", res.Rows[0].Links["name"])
	})
	t.Run("a global report runs where no local one has its name", func(t *testing.T) {
		assert.Equal(t, []interface{}{"global"}, column(fx.run(t, "other", "apps", nil), "from"))
	})
	t.Run("parameters reach the report", func(t *testing.T) {
		assert.Empty(t, fx.run(t, "shop", "deployments", map[string]interface{}{"name": "nope"}).Rows)
	})
	t.Run("expressions and definitions come with components", func(t *testing.T) {
		res := fx.run(t, "shop", "components", nil)
		assert.Equal(t, []interface{}{int64(1), int64(0)}, column(res, "expressions"))
		assert.Equal(t, []interface{}{false, true}, column(res, "missing"), "webapp has v1; cpuscaler has no v9")
	})
	t.Run("an unknown report is not found", func(t *testing.T) {
		_, err := fx.svc.RunReport(context.Background(), "shop", "nope", nil)
		assert.Equal(t, bcode.ErrReportNotFound, err)
	})
	t.Run("an empty report is an empty table", func(t *testing.T) {
		res := fx.run(t, "shop", "deployments", map[string]interface{}{"name": "nope"})
		assert.NotNil(t, res.Rows)
	})
}

func TestBuiltinReports(t *testing.T) {
	fx := newReportFixture(t, false)
	ctx := context.Background()
	now := time.Date(2026, 10, 4, 12, 0, 0, 0, time.UTC)
	fx.svc.now = func() time.Time { return now }
	for name, src := range report.Builtins() {
		require.NoError(t, fx.svc.ServerKubeClient.Create(ctx, reportConfigMap("vela-system", "builtin-"+name, src)))
	}
	labels := map[string]string{"app.oam.dev/name": "storefront"}
	min, cpu, target := int32(1), int32(80), int32(60)
	replicas := int32(2)
	container := func(name, image, cpu, memory string) corev1.Container {
		c := corev1.Container{Name: name, Image: image}
		if cpu != "" {
			c.Resources.Requests = corev1.ResourceList{corev1.ResourceCPU: resource.MustParse(cpu), corev1.ResourceMemory: resource.MustParse(memory)}
			c.Resources.Limits = corev1.ResourceList{corev1.ResourceMemory: resource.MustParse(memory)}
		}
		return c
	}
	pod := func(ns, name, image string, restarts int32, waiting string) *corev1.Pod {
		p := &corev1.Pod{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns, Labels: labels}, Spec: corev1.PodSpec{Containers: []corev1.Container{container("web", image, "", "")}}}
		st := corev1.ContainerStatus{Name: "web", RestartCount: restarts}
		if waiting != "" {
			st.State.Waiting = &corev1.ContainerStateWaiting{Reason: waiting}
			st.LastTerminationState.Terminated = &corev1.ContainerStateTerminated{Reason: "Error"}
		}
		p.Status.ContainerStatuses = []corev1.ContainerStatus{st}
		return p
	}
	app := &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{Name: "storefront", Namespace: "shop"}}
	app.Status.Phase = "running"
	app.Status.Services = []apicommon.ApplicationComponentStatus{{Name: "storefront-web", Healthy: false, Message: "0/2 ready",
		Traits: []apicommon.ApplicationTraitStatus{{Type: "cpuscaler", Healthy: false, Message: "no metrics"}}}}
	for _, obj := range []client.Object{
		app,
		&appsv1.StatefulSet{ObjectMeta: metav1.ObjectMeta{Name: "storefront-db", Namespace: "shop-prod", Labels: labels},
			Spec: appsv1.StatefulSetSpec{Replicas: &replicas, Template: corev1.PodTemplateSpec{Spec: corev1.PodSpec{Containers: []corev1.Container{container("db", "postgres:16", "500m", "512Mi")}}}}},
		pod("shop-prod", "storefront-web-1", "shop/storefront:1.2", 5, "CrashLoopBackOff"),
		pod("shop-prod", "storefront-web-2", "shop/storefront:latest", 0, ""),
		pod("other-prod", "secret-api-1", "secret/api:1", 9, "CrashLoopBackOff"),
		&corev1.Event{ObjectMeta: metav1.ObjectMeta{Name: "e1", Namespace: "shop-prod"}, Type: "Warning", Reason: "BackOff", Count: 4,
			InvolvedObject: corev1.ObjectReference{Kind: "Pod", Name: "storefront-web-1"}, LastTimestamp: metav1.NewTime(now)},
		&corev1.Event{ObjectMeta: metav1.ObjectMeta{Name: "e2", Namespace: "shop-prod"}, Type: "Normal", Reason: "Pulled"},
		&corev1.Event{ObjectMeta: metav1.ObjectMeta{Name: "e3", Namespace: "other-prod"}, Type: "Warning", Reason: "BackOff"},
		&corev1.ResourceQuota{ObjectMeta: metav1.ObjectMeta{Name: "shop", Namespace: "shop-prod"}, Status: corev1.ResourceQuotaStatus{
			Hard: corev1.ResourceList{"cpu": resource.MustParse("4"), "requests.memory": resource.MustParse("8Gi"), "pods": resource.MustParse("20")},
			Used: corev1.ResourceList{"cpu": resource.MustParse("3"), "requests.memory": resource.MustParse("2Gi"), "pods": resource.MustParse("5")},
		}},
		&autoscalingv1.HorizontalPodAutoscaler{
			ObjectMeta: metav1.ObjectMeta{Name: "storefront-web", Namespace: "shop-prod", Labels: labels},
			Spec:       autoscalingv1.HorizontalPodAutoscalerSpec{MinReplicas: &min, MaxReplicas: 5, TargetCPUUtilizationPercentage: &target},
			Status:     autoscalingv1.HorizontalPodAutoscalerStatus{CurrentReplicas: 5, CurrentCPUUtilizationPercentage: &cpu},
		},
	} {
		require.NoError(t, fx.svc.ServerKubeClient.Create(ctx, obj))
	}
	at := func(minutes int) time.Time { return now.Add(time.Duration(-minutes) * time.Minute) }
	for _, e := range []datastore.Entity{
		&model.Env{Name: "production", Project: "shop", Namespace: "shop"},
		&model.Env{Name: "other", Project: "other", Namespace: "other"},
		&model.EnvBinding{AppPrimaryKey: "storefront", Name: "production"},
		&model.Workflow{AppPrimaryKey: "storefront", Name: "workflow-production", EnvName: "production"},
		&model.ApplicationRevision{AppPrimaryKey: "storefront", Version: "v1", EnvName: "production", DeployUser: "alice", Note: "First", TriggerType: "web"},
		&model.ApplicationRevision{AppPrimaryKey: "storefront", Version: "v2", EnvName: "production", DeployUser: "bob", TriggerType: "api", Status: "failure"},
		&model.WorkflowRecord{AppPrimaryKey: "storefront", WorkflowName: "workflow-production", Name: "run-1", Status: "failed", RevisionPrimaryKey: "v1",
			StartTime: at(300), EndTime: at(295),
			Steps: []model.WorkflowStepStatus{{StepStatus: model.StepStatus{Name: "check", Phase: "failed", Message: "timed out"}}}},
		&model.WorkflowRecord{AppPrimaryKey: "storefront", WorkflowName: "workflow-production", Name: "run-2", Status: "succeeded", RevisionPrimaryKey: "v1",
			StartTime: at(200), EndTime: at(198)},
		&model.WorkflowRecord{AppPrimaryKey: "storefront", WorkflowName: "workflow-production", Name: "run-3", Status: "suspending", RevisionPrimaryKey: "v2",
			StartTime: at(30), Steps: []model.WorkflowStepStatus{
				{StepStatus: model.StepStatus{Name: "deploy", Phase: "succeeded", FirstExecuteTime: at(30), LastExecuteTime: at(29)}},
				{StepStatus: model.StepStatus{Name: "approve", Alias: "Approve release", Phase: "suspending", FirstExecuteTime: at(20)}},
			}},
		&model.WorkflowRecord{AppPrimaryKey: "secret", WorkflowName: "workflow-production", Name: "run-9", Status: "failed", StartTime: at(10), EndTime: at(9)},
	} {
		require.NoError(t, fx.svc.Store.Add(ctx, e))
	}

	list, err := fx.svc.ListReports(ctx, "shop")
	require.NoError(t, err)
	builtins := 0
	for _, r := range list.Reports {
		if strings.HasPrefix(r.ID, "builtin-") {
			builtins++
			assert.Empty(t, r.Error, r.ID)
		}
	}
	assert.Equal(t, 12, builtins)

	stat := func(res *apisv1.ReportResult, label string) interface{} {
		for _, s := range res.Stats {
			if s.Label == label {
				return s.Value
			}
		}
		return "no stat " + label
	}
	t.Run("unhealthy applications", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-unhealthy-applications", nil)
		assert.Equal(t, []interface{}{"storefront-web", "storefront-web / cpuscaler"}, column(res, "name"))
		assert.Equal(t, []interface{}{"0/2 ready", "no metrics"}, column(res, "message"))
		assert.Equal(t, int64(1), stat(res, "Unhealthy"))
	})
	t.Run("delivery", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-delivery", nil)
		assert.Equal(t, []interface{}{"run-3", "run-2", "run-1"}, column(res, "run"), "only shop's, latest first")
		assert.Equal(t, []interface{}{"", "", "check"}, column(res, "step"))
		assert.Equal(t, 50.0, number(stat(res, "Success rate")))
		assert.Equal(t, 120.0, number(stat(res, "Average deploy")))
		assert.Equal(t, []interface{}{"run-1"}, column(fx.run(t, "shop", "builtin-delivery", map[string]interface{}{"failuresOnly": true}), "run"))
	})
	t.Run("waiting", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-waiting", nil)
		assert.Equal(t, []interface{}{"Approve release"}, column(res, "step"))
		assert.Equal(t, []interface{}{int64(1200)}, column(res, "waited"))
		assert.Equal(t, []interface{}{"bob"}, column(res, "user"))
	})
	t.Run("recent changes", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-recent-changes", map[string]interface{}{"count": 2})
		assert.Equal(t, []interface{}{"v2", "v1"}, column(res, "revision"))
		assert.Equal(t, []interface{}{"bob", "alice"}, column(res, "user"))
	})
	t.Run("environment drift", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-environment-drift", map[string]interface{}{"all": true})
		assert.Equal(t, []interface{}{"production"}, column(res, "env"))
		assert.Equal(t, []interface{}{"Last deploy failed"}, column(res, "state"), "the cluster refused v2")
	})
	t.Run("autoscaler saturation", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-autoscaler-saturation", nil)
		assert.Equal(t, []interface{}{"At maximum"}, column(res, "state"))
		assert.Equal(t, []interface{}{"1-5"}, column(res, "bounds"))
	})
	t.Run("restarting pods", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-restarting-pods", nil)
		assert.Equal(t, []interface{}{"storefront-web-1"}, column(res, "pod"), "only shop's, only those restarting")
		assert.Equal(t, []interface{}{"CrashLoopBackOff"}, column(res, "reason"))
		assert.Equal(t, []interface{}{"Error"}, column(res, "lastExit"))
	})
	t.Run("type versions", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-type-versions", nil)
		assert.Equal(t, []interface{}{"cpuscaler"}, column(res, "type"))
		assert.Equal(t, []interface{}{"Pinned to a missing version"}, column(res, "state"))
		assert.Len(t, fx.run(t, "shop", "builtin-type-versions", map[string]interface{}{"all": true}).Rows, 2)
	})
	t.Run("requests and limits", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-requests-and-limits", nil)
		assert.Equal(t, []interface{}{"storefront-db", "storefront-web"}, column(res, "workload"))
		assert.Equal(t, 1.0, number(res.Rows[0].Values["cpu"]), "500m twice")
		assert.Equal(t, 1024.0, number(res.Rows[0].Values["memory"]), "512Mi twice")
		assert.Equal(t, "", res.Rows[0].Values["missing"])
		assert.Equal(t, int64(1), stat(res, "Workloads missing requests or limits"))
	})
	t.Run("running images", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-running-images", nil)
		assert.Equal(t, []interface{}{"1.2", "latest"}, column(res, "tag"), "only shop's")
		assert.Equal(t, []interface{}{"Several tags in use", "Uses latest"}, column(res, "flag"))
	})
	t.Run("warning events", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-warning-events", nil)
		assert.Equal(t, []interface{}{"Pod/storefront-web-1"}, column(res, "object"), "only shop's warnings")
		assert.Equal(t, int64(4), stat(res, "Warnings"))
	})
	t.Run("quota usage", func(t *testing.T) {
		res := fx.run(t, "shop", "builtin-quota-usage", nil)
		assert.Equal(t, []interface{}{"cpu", "pods", "requests.memory"}, column(res, "resource"))
		assert.Equal(t, []float64{75, 25, 25}, []float64{number(res.Rows[0].Values["percent"]), number(res.Rows[1].Values["percent"]), number(res.Rows[2].Values["percent"])})
	})
}

func number(v interface{}) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case int64:
		return float64(n)
	case int:
		return float64(n)
	}
	return -1
}

func TestReportData(t *testing.T) {
	fx := newReportFixture(t, false)
	ctx := context.Background()
	now := time.Date(2026, 10, 4, 12, 0, 0, 0, time.UTC)
	fx.svc.now = func() time.Time { return now }
	started := now.Add(-10 * time.Minute)
	for _, e := range []datastore.Entity{
		&model.Env{Name: "production", Project: "shop", Namespace: "shop"},
		&model.EnvBinding{AppPrimaryKey: "storefront", Name: "production"},
		&model.Workflow{AppPrimaryKey: "storefront", Name: "workflow-production", EnvName: "production"},
		&model.ApplicationRevision{AppPrimaryKey: "storefront", Version: "v2", EnvName: "production", Status: "running", DeployUser: "alice", Note: "Bump", TriggerType: "web"},
		&model.WorkflowRecord{AppPrimaryKey: "storefront", WorkflowName: "workflow-production", Name: "run-1", Status: "suspending", StartTime: started, RevisionPrimaryKey: "v2",
			Steps: []model.WorkflowStepStatus{
				{StepStatus: model.StepStatus{Name: "deploy", Phase: "succeeded", FirstExecuteTime: started, LastExecuteTime: started.Add(time.Minute)}},
				{StepStatus: model.StepStatus{Name: "approve", Type: "suspend", Phase: "suspending", FirstExecuteTime: started.Add(time.Minute)}},
			}},
	} {
		require.NoError(t, fx.svc.Store.Add(ctx, e))
	}
	require.NoError(t, fx.svc.ServerKubeClient.Create(ctx, &v1beta1.Application{ObjectMeta: metav1.ObjectMeta{Name: "storefront", Namespace: "shop"}}))
	source, err := fx.svc.projectSource(utils.WithUsername(ctx, "alice"), "shop")
	require.NoError(t, err)

	t.Run("runs carry their revision and how long they and their steps have taken", func(t *testing.T) {
		runs, err := source.Runs(ctx)
		require.NoError(t, err)
		require.Len(t, runs, 1)
		r := runs[0]
		assert.Equal(t, []interface{}{"v2", "alice", "Bump", "web"}, []interface{}{r.Revision, r.User, r.Note, r.Trigger})
		assert.Equal(t, int64(600), r.Seconds, "still going: up to now")
		assert.Equal(t, int64(60), r.Steps[0].Seconds, "finished: start to end")
		assert.Equal(t, int64(540), r.Steps[1].Seconds, "waiting: up to now")
	})

	t.Run("environments say what is deployed and whether the app now differs from it", func(t *testing.T) {
		differs := false
		fx.svc.undeployed = func(_ context.Context, app *model.Application, env string) (bool, error) {
			assert.Equal(t, "storefront", app.Name)
			assert.Equal(t, "production", env)
			return differs, nil
		}
		envs, err := source.Environments(ctx)
		require.NoError(t, err)
		require.Len(t, envs, 1)
		assert.Equal(t, "v2", envs[0].Revision)
		assert.False(t, envs[0].Edited)

		differs = true
		envs, err = source.Environments(ctx)
		require.NoError(t, err)
		assert.True(t, envs[0].Edited, "the app as it would deploy now differs from what runs")
	})

	t.Run("List reads the environments' namespaces too", func(t *testing.T) {
		apps, err := source.List(ctx, "core.oam.dev/v1beta1", "Application")
		require.NoError(t, err)
		require.Len(t, apps, 1)
		assert.Equal(t, "shop", apps[0].Namespace)
	})
}
