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
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/getkin/kin-openapi/openapi3"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	k8stypes "k8s.io/apimachinery/pkg/types"
	"k8s.io/apiserver/pkg/authentication/user"
	"k8s.io/apiserver/pkg/endpoints/request"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/auth"
	"github.com/oam-dev/kubevela/pkg/multicluster"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/report"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

const (
	// reportLabel marks a ConfigMap as a report.
	reportLabel = "velaux.oam.dev/report"
	// reportTemplateKey holds a report's CUE.
	reportTemplateKey = "template"

	reportScopeLocal  = "local"
	reportScopeGlobal = "global"
)

// ReportService lists and runs reports: labelled ConfigMaps of CUE, local in a
// project's namespace or global in vela-system, each run over one project.
type ReportService interface {
	ListReports(ctx context.Context, project string) (*apisv1.ListReportsResponse, error)
	RunReport(ctx context.Context, project, id string, parameters map[string]interface{}) (*apisv1.ReportResult, error)
}

type reportServiceImpl struct {
	// KubeClient reads as the signed-in user: a project's own reports.
	KubeClient client.Client `inject:"kubeClient"`
	// ServerKubeClient reads as VelaUX: global reports and definitions, which
	// every project may use, and, impersonating the project, what a report
	// lists.
	ServerKubeClient client.Client       `inject:"serverKubeClient"`
	Store            datastore.DataStore `inject:"datastore"`
	// ApplicationService compares an application as it is now with what runs.
	ApplicationService ApplicationService `inject:""`
	// now is the clock elapsed times are read against; time.Now unless a test
	// fixes it.
	now func() time.Time
	// undeployed says the application as VelaUX would deploy it now differs
	// from what runs in env; CompareApp unless a test replaces it.
	undeployed func(ctx context.Context, app *model.Application, env string) (bool, error)
}

// differsFromRunning compares as the application page does, so the two agree.
func (r *reportServiceImpl) differsFromRunning(ctx context.Context, app *model.Application, env string) (bool, error) {
	if r.undeployed != nil {
		return r.undeployed(ctx, app, env)
	}
	res, err := r.ApplicationService.CompareApp(ctx, app, apisv1.AppCompareReq{CompareLatestWithRunning: &apisv1.CompareLatestWithRunningOption{Env: env}})
	if err != nil {
		return false, err
	}
	if res.Error != "" {
		return false, errors.New(res.Error)
	}
	return res.IsDiff, nil
}

// NewReportService is the reports.
func NewReportService() ReportService {
	return &reportServiceImpl{}
}

// ListReports lists the project's reports, then the global ones. Global ones
// that cannot be read leave the project's alone, saying so.
func (r *reportServiceImpl) ListReports(ctx context.Context, project string) (*apisv1.ListReportsResponse, error) {
	namespace, err := r.projectNamespace(ctx, project)
	if err != nil {
		return nil, err
	}
	local := &corev1.ConfigMapList{}
	if err := r.KubeClient.List(ctx, local, client.InNamespace(namespace), client.MatchingLabels{reportLabel: True}); err != nil {
		return nil, err
	}
	global := &corev1.ConfigMapList{}
	unavailable := false
	if namespace != types.DefaultKubeVelaNS {
		if err := r.ServerKubeClient.List(ctx, global, client.InNamespace(types.DefaultKubeVelaNS), client.MatchingLabels{reportLabel: True}); err != nil {
			klog.Warningf("global reports could not be listed: %v", err)
			global.Items, unavailable = nil, true
		}
	}
	return &apisv1.ListReportsResponse{Reports: reportsOf(local.Items, global.Items), GlobalUnavailable: unavailable}, nil
}

// reportsOf is the catalogue: local reports, then global ones, each by name, a
// global one hidden where a local one has its name.
func reportsOf(local, global []corev1.ConfigMap) []apisv1.ReportMeta {
	byName := func(cms []corev1.ConfigMap) {
		sort.Slice(cms, func(i, j int) bool { return cms[i].Name < cms[j].Name })
	}
	byName(local)
	byName(global)
	out := make([]apisv1.ReportMeta, 0, len(local)+len(global))
	names := map[string]bool{}
	for _, cm := range local {
		names[cm.Name] = true
		out = append(out, reportMeta(cm, reportScopeLocal))
	}
	for _, cm := range global {
		meta := reportMeta(cm, reportScopeGlobal)
		meta.Hidden = names[cm.Name]
		out = append(out, meta)
	}
	return out
}

// reportMeta is a report as the catalogue shows it, with why it cannot run
// where its CUE is not a report.
func reportMeta(cm corev1.ConfigMap, scope string) apisv1.ReportMeta {
	meta := apisv1.ReportMeta{ID: cm.Name, Title: cm.Name, Scope: scope}
	src := cm.Data[reportTemplateKey]
	spec, err := report.ParseSpec(src)
	if err != nil {
		meta.Error = err.Error()
		return meta
	}
	if spec.Title != "" {
		meta.Title = spec.Title
	}
	meta.Description = spec.Description
	params, err := report.ParameterSchemas(src)
	if err != nil {
		meta.Error = err.Error()
		return meta
	}
	if params != nil {
		meta.Parameters = params.UI
	}
	return meta
}

// RunReport runs a report over one project: the project's own of that name,
// else the global one.
func (r *reportServiceImpl) RunReport(ctx context.Context, project, id string, parameters map[string]interface{}) (*apisv1.ReportResult, error) {
	cm, scope, err := r.findReport(ctx, project, id)
	if err != nil {
		return nil, err
	}
	source, err := r.projectSource(ctx, project)
	if err != nil {
		return nil, err
	}
	meta := reportMeta(*cm, scope)
	if meta.Error != "" {
		return nil, bcode.ErrReportInvalid.SetMessage(meta.Error)
	}
	result, err := report.Run(ctx, cm.Data[reportTemplateKey], source, parameters)
	if err != nil {
		return nil, bcode.ErrReportFailed.SetMessage(fmt.Sprintf("the report failed: %s", err.Error()))
	}
	result.Report = meta
	result.Project = project
	result.GeneratedAt = time.Now()
	return result, nil
}

func (r *reportServiceImpl) findReport(ctx context.Context, project, id string) (*corev1.ConfigMap, string, error) {
	namespace, err := r.projectNamespace(ctx, project)
	if err != nil {
		return nil, "", err
	}
	cm := &corev1.ConfigMap{}
	err = r.KubeClient.Get(ctx, k8stypes.NamespacedName{Namespace: namespace, Name: id}, cm)
	if err == nil && cm.Labels[reportLabel] == True {
		return cm, reportScopeLocal, nil
	}
	if err != nil && !apierrors.IsNotFound(err) {
		return nil, "", err
	}
	cm = &corev1.ConfigMap{}
	err = r.ServerKubeClient.Get(ctx, k8stypes.NamespacedName{Namespace: types.DefaultKubeVelaNS, Name: id}, cm)
	if err == nil && cm.Labels[reportLabel] == True {
		return cm, reportScopeGlobal, nil
	}
	if err != nil && !apierrors.IsNotFound(err) {
		return nil, "", err
	}
	return nil, "", bcode.ErrReportNotFound
}

func (r *reportServiceImpl) projectNamespace(ctx context.Context, project string) (string, error) {
	p := &model.Project{Name: project}
	if err := r.Store.Get(ctx, p); err != nil {
		if err == datastore.ErrRecordNotExist {
			return "", bcode.ErrProjectIsNotExist
		}
		return "", err
	}
	if p.Namespace == "" {
		return project, nil
	}
	return p.Namespace, nil
}

// projectSource is what a report run for the signed-in user may read: the
// project's applications and runs from VelaUX's store, definitions, and
// resources in its environments' namespaces and those its targets deploy to,
// listed as the project.
func (r *reportServiceImpl) projectSource(ctx context.Context, project string) (*projectSource, error) {
	s := &projectSource{r: r, project: project, now: r.now}
	if s.now == nil {
		s.now = time.Now
	}
	apps, err := r.Store.List(ctx, &model.Application{Project: project}, nil)
	if err != nil {
		return nil, err
	}
	for _, e := range apps {
		if app, ok := e.(*model.Application); ok && app.Project == project {
			s.apps = append(s.apps, app)
		}
	}
	targets, err := r.Store.List(ctx, &model.Target{Project: project}, nil)
	if err != nil {
		return nil, err
	}
	seen := map[clusterNamespace]bool{}
	for _, e := range targets {
		t, ok := e.(*model.Target)
		if !ok || t.Project != project || t.Cluster == nil || t.Cluster.Namespace == "" {
			continue
		}
		ns := clusterNamespace{cluster: t.Cluster.ClusterName, namespace: t.Cluster.Namespace}
		if !seen[ns] {
			seen[ns] = true
			s.namespaces = append(s.namespaces, ns)
		}
	}
	envs, err := r.Store.List(ctx, &model.Env{Project: project}, nil)
	if err != nil {
		return nil, err
	}
	for _, e := range envs {
		env, ok := e.(*model.Env)
		if !ok || env.Project != project || env.Namespace == "" {
			continue
		}
		ns := clusterNamespace{cluster: multicluster.ClusterLocalName, namespace: env.Namespace}
		if !seen[ns] {
			seen[ns] = true
			s.namespaces = append(s.namespaces, ns)
		}
	}
	sort.Slice(s.namespaces, func(i, j int) bool {
		return s.namespaces[i].cluster+s.namespaces[i].namespace < s.namespaces[j].cluster+s.namespaces[j].namespace
	})
	name, _ := utils.UsernameFrom(ctx)
	if name == "" {
		name = user.Anonymous
	}
	s.as = &user.DefaultInfo{Name: name, Groups: []string{utils.KubeVelaProjectGroupPrefix + project, auth.KubeVelaClientGroup}}
	return s, nil
}

type clusterNamespace struct {
	cluster   string
	namespace string
}

type projectSource struct {
	r          *reportServiceImpl
	project    string
	apps       []*model.Application
	namespaces []clusterNamespace
	// as is who a report's Kubernetes reads run as: the user, in the project's
	// group, whatever VelaUX's impersonation gate says.
	as  user.Info
	now func() time.Time
}

var _ report.Source = &projectSource{}

func (s *projectSource) Apps(context.Context) ([]report.App, error) {
	out := make([]report.App, 0, len(s.apps))
	for _, a := range s.apps {
		out = append(out, report.App{Name: a.Name, Alias: a.Alias, Description: a.Description})
	}
	return out, nil
}

func (s *projectSource) Components(ctx context.Context) ([]report.Component, error) {
	out := []report.Component{}
	for _, app := range s.apps {
		comps, err := s.r.Store.List(ctx, &model.ApplicationComponent{AppPrimaryKey: app.PrimaryKey()}, nil)
		if err != nil {
			return nil, err
		}
		for _, e := range comps {
			c, ok := e.(*model.ApplicationComponent)
			if !ok {
				continue
			}
			out = append(out, componentOf(app.Name, c.Name, "component", c.Type, c.Properties))
			for _, t := range c.Traits {
				out = append(out, componentOf(app.Name, c.Name, "trait", t.Type, t.Properties))
			}
		}
	}
	return out, nil
}

func componentOf(app, component, kind, typ string, properties *model.JSONStruct) report.Component {
	c := report.Component{App: app, Component: component, Kind: kind, Type: typ}
	if properties == nil {
		return c
	}
	c.Properties = *properties
	_ = walkExpressions("", map[string]interface{}(*properties), nil, func(path, value string, _ *openapi3.Schema) error {
		c.Expressions = append(c.Expressions, report.Expression{Property: path, Expression: value})
		return nil
	})
	return c
}

func (s *projectSource) Runs(ctx context.Context) ([]report.WorkflowRun, error) {
	out := []report.WorkflowRun{}
	for _, app := range s.apps {
		records, err := s.r.Store.List(ctx, &model.WorkflowRecord{AppPrimaryKey: app.PrimaryKey()}, nil)
		if err != nil {
			return nil, err
		}
		envOf := map[string]string{}
		for _, e := range records {
			rec, ok := e.(*model.WorkflowRecord)
			if !ok {
				continue
			}
			if _, done := envOf[rec.WorkflowName]; !done {
				wf := &model.Workflow{AppPrimaryKey: app.PrimaryKey(), Name: rec.WorkflowName}
				if err := s.r.Store.Get(ctx, wf); err == nil {
					envOf[rec.WorkflowName] = wf.EnvName
				}
			}
			run := report.WorkflowRun{App: app.Name, Env: envOf[rec.WorkflowName], Workflow: rec.WorkflowName, Name: rec.Name,
				Status: rec.Status, Started: timeOf(rec.StartTime), Finished: timeOf(rec.EndTime), Seconds: s.elapsed(rec.StartTime, rec.EndTime)}
			if rec.RevisionPrimaryKey != "" {
				rev := &model.ApplicationRevision{AppPrimaryKey: app.PrimaryKey(), Version: rec.RevisionPrimaryKey}
				if err := s.r.Store.Get(ctx, rev); err == nil {
					run.Revision, run.User, run.Note, run.Trigger = rev.Version, rev.DeployUser, rev.Note, rev.TriggerType
				}
			}
			for _, st := range rec.Steps {
				run.Steps = append(run.Steps, report.RunStep{Name: st.Name, Alias: st.Alias, Type: st.Type, Phase: string(st.Phase), Message: st.Message,
					Started: timeOf(st.FirstExecuteTime), Seconds: s.elapsed(st.FirstExecuteTime, finishedStep(st))})
			}
			out = append(out, run)
		}
	}
	return out, nil
}

// finishedStep is when a step finished, or zero for one still going.
func finishedStep(st model.WorkflowStepStatus) time.Time {
	switch string(st.Phase) {
	case "running", "pending", "suspending", "":
		return time.Time{}
	}
	return st.LastExecuteTime
}

// elapsed is the seconds from start to end, or to now where end is unset; 0
// for no start.
func (s *projectSource) elapsed(start, end time.Time) int64 {
	if timeOf(start) == "" {
		return 0
	}
	if timeOf(end) == "" {
		end = s.now()
	}
	if end.Before(start) {
		return 0
	}
	return int64(end.Sub(start).Seconds())
}

// Environments are each application's environments, with the revision last
// deployed there; edited says the application as VelaUX would deploy it now
// differs from what runs there. The latest revision may not be what runs: a
// deploy the cluster refused leaves a failed revision and the earlier spec.
func (s *projectSource) Environments(ctx context.Context) ([]report.Environment, error) {
	out := []report.Environment{}
	var compares []envCompare
	for _, app := range s.apps {
		bindings, err := s.r.Store.List(ctx, &model.EnvBinding{AppPrimaryKey: app.PrimaryKey()}, nil)
		if err != nil {
			return nil, err
		}
		revisions, err := s.r.Store.List(ctx, &model.ApplicationRevision{AppPrimaryKey: app.PrimaryKey()}, nil)
		if err != nil {
			return nil, err
		}
		for _, b := range bindings {
			binding, ok := b.(*model.EnvBinding)
			if !ok {
				continue
			}
			env := report.Environment{App: app.Name, Env: binding.Name}
			var latest *model.ApplicationRevision
			for _, r := range revisions {
				rev, ok := r.(*model.ApplicationRevision)
				if ok && rev.EnvName == binding.Name && (latest == nil || rev.CreateTime.After(latest.CreateTime)) {
					latest = rev
				}
			}
			if latest == nil {
				env.Edited = true
				out = append(out, env)
				continue
			}
			env.Revision, env.Status, env.DeployedAt, env.User = latest.Version, latest.Status, timeOf(latest.CreateTime), latest.DeployUser
			out = append(out, env)
			compares = append(compares, envCompare{index: len(out) - 1, app: app})
		}
	}
	// Each comparison renders the application and reads what runs, so they run
	// a few at a time.
	var wg sync.WaitGroup
	sem := make(chan struct{}, compareConcurrency)
	for _, c := range compares {
		wg.Add(1)
		sem <- struct{}{}
		go func(c envCompare) {
			defer func() { <-sem; wg.Done() }()
			differs, err := s.r.differsFromRunning(ctx, c.app, out[c.index].Env)
			if err != nil {
				klog.Warningf("report: compare %s in %s: %v", c.app.Name, out[c.index].Env, err)
			}
			out[c.index].Edited = differs
		}(c)
	}
	wg.Wait()
	return out, nil
}

// compareConcurrency is how many environments Environments compares at once.
const compareConcurrency = 4

type envCompare struct {
	index int
	app   *model.Application
}

func timeOf(t time.Time) string {
	if t.IsZero() || t.Year() < 2000 {
		return ""
	}
	return t.Format(time.RFC3339)
}

// Definitions are read as VelaUX: they are global, as the catalogue of types
// every project picks from.
func (s *projectSource) Definitions(ctx context.Context) ([]report.Definition, error) {
	defs := map[string]*report.Definition{}
	add := func(kind, name string) *report.Definition {
		key := kind + "/" + name
		if defs[key] == nil {
			defs[key] = &report.Definition{Name: name, Kind: kind, Versions: []string{}}
		}
		return defs[key]
	}
	components := &v1beta1.ComponentDefinitionList{}
	if err := s.r.ServerKubeClient.List(ctx, components, client.InNamespace(types.DefaultKubeVelaNS)); err != nil {
		return nil, err
	}
	for _, d := range components.Items {
		add("component", d.Name)
	}
	traits := &v1beta1.TraitDefinitionList{}
	if err := s.r.ServerKubeClient.List(ctx, traits, client.InNamespace(types.DefaultKubeVelaNS)); err != nil {
		return nil, err
	}
	for _, d := range traits.Items {
		add("trait", d.Name)
	}
	revisions := &v1beta1.DefinitionRevisionList{}
	if err := s.r.ServerKubeClient.List(ctx, revisions, client.InNamespace(types.DefaultKubeVelaNS)); err != nil {
		return nil, err
	}
	sort.Slice(revisions.Items, func(i, j int) bool { return revisions.Items[i].Spec.Revision > revisions.Items[j].Spec.Revision })
	for _, rev := range revisions.Items {
		kind := ""
		switch rev.Spec.DefinitionType {
		case "Component":
			kind = "component"
		case "Trait":
			kind = "trait"
		default:
			continue
		}
		name := revisionOf(rev)
		d := add(kind, name)
		version := strings.TrimPrefix(rev.Name, name+"-")
		if d.Latest == "" {
			d.Latest = version
		}
		d.Versions = append(d.Versions, version)
	}
	out := make([]report.Definition, 0, len(defs))
	for _, d := range defs {
		out = append(out, *d)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Kind+"/"+out[i].Name < out[j].Kind+"/"+out[j].Name })
	return out, nil
}

// List lists a kind in each of the project's namespaces as the project, so
// Kubernetes decides what it may see. A namespace it cannot read is left out.
func (s *projectSource) List(ctx context.Context, apiVersion, kind string) ([]report.Object, error) {
	gv, err := schema.ParseGroupVersion(apiVersion)
	if err != nil {
		return nil, err
	}
	out := []report.Object{}
	asProject := request.WithUser(ctx, s.as)
	for _, ns := range s.namespaces {
		list := &unstructured.UnstructuredList{}
		list.SetGroupVersionKind(gv.WithKind(kind + "List"))
		cctx := multicluster.ContextWithClusterName(asProject, ns.cluster)
		if err := s.r.ServerKubeClient.List(cctx, list, client.InNamespace(ns.namespace)); err != nil {
			klog.Warningf("report: list %s in %s/%s for project %s: %v", kind, ns.cluster, ns.namespace, s.project, err)
			continue
		}
		for _, item := range list.Items {
			out = append(out, report.Object{Cluster: ns.cluster, Namespace: ns.namespace, Object: item.Object})
		}
	}
	return out, nil
}
