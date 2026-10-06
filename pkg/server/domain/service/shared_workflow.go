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

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"

	velatypes "github.com/oam-dev/kubevela/apis/types"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/repository"
	"github.com/kubevela/velaux/pkg/server/event/sync/convert"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	assembler "github.com/kubevela/velaux/pkg/server/interfaces/api/assembler/v1"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// Where a shared Workflow is: the project's namespace, the system namespace,
// or, for a ref only, an environment namespace that is not the project's.
const (
	sharedScopeProject     = "project"
	sharedScopeGlobal      = "global"
	sharedScopeEnvironment = "environment"
)

const (
	annoSharedWorkflowAlias       = "velaux.oam.dev/alias"
	annoSharedWorkflowDescription = "velaux.oam.dev/description"
)

// SharedWorkflowService manages the shared Workflows a project's application
// workflows can reference: the project's own and the global ones.
type SharedWorkflowService interface {
	ListSharedWorkflows(ctx context.Context, projectName string) (*apisv1.ListSharedWorkflowsResponse, error)
	DetailSharedWorkflow(ctx context.Context, projectName, scope, name string) (*apisv1.SharedWorkflow, error)
	CreateSharedWorkflow(ctx context.Context, projectName, scope string, req apisv1.SharedWorkflowRequest) (*apisv1.SharedWorkflow, error)
	UpdateSharedWorkflow(ctx context.Context, projectName, scope, name string, req apisv1.SharedWorkflowRequest) (*apisv1.SharedWorkflow, error)
	DeleteSharedWorkflow(ctx context.Context, projectName, scope, name string) error
}

// NewSharedWorkflowService is the service for shared Workflows.
func NewSharedWorkflowService() SharedWorkflowService {
	return &sharedWorkflowServiceImpl{}
}

type sharedWorkflowServiceImpl struct {
	Store datastore.DataStore `inject:"datastore"`
	// KubeClient acts as the signed-in user: the project's namespace.
	KubeClient client.Client `inject:"kubeClient"`
	// ServerKubeClient acts as VelaUX: the system namespace, which project
	// users cannot read and only admins may change, by VelaUX's RBAC.
	ServerKubeClient client.Client `inject:"serverKubeClient"`
}

// ListSharedWorkflows lists the project's shared Workflows, then the global
// ones, with what uses each.
func (s *sharedWorkflowServiceImpl) ListSharedWorkflows(ctx context.Context, projectName string) (*apisv1.ListSharedWorkflowsResponse, error) {
	namespace, err := projectNamespace(ctx, s.Store, projectName)
	if err != nil {
		return nil, err
	}
	shared, unavailable, err := listSharedWorkflows(ctx, s.KubeClient, s.ServerKubeClient, namespace)
	if err != nil {
		return nil, err
	}
	refs, err := s.workflowRefs(ctx)
	if err != nil {
		return nil, err
	}
	for i := range shared {
		shared[i].UsedBy, shared[i].UsedElsewhere = usesOf(refs, shared[i].Namespace, shared[i].Name, projectName)
	}
	return &apisv1.ListSharedWorkflowsResponse{Workflows: shared, GlobalUnavailable: unavailable, ProjectNamespace: namespace}, nil
}

// DetailSharedWorkflow is the shared Workflow named name in scope, with what
// uses it.
func (s *sharedWorkflowServiceImpl) DetailSharedWorkflow(ctx context.Context, projectName, scope, name string) (*apisv1.SharedWorkflow, error) {
	namespace, cli, err := s.target(ctx, projectName, scope)
	if err != nil {
		return nil, err
	}
	wf := &wfTypesv1alpha1.Workflow{}
	if err := cli.Get(ctx, types.NamespacedName{Namespace: namespace, Name: name}, wf); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, bcode.ErrSharedWorkflowNotFound
		}
		return nil, err
	}
	shared, err := sharedWorkflowOf(*wf, scope)
	if err != nil {
		return nil, err
	}
	refs, err := s.workflowRefs(ctx)
	if err != nil {
		return nil, err
	}
	shared.UsedBy, shared.UsedElsewhere = usesOf(refs, namespace, name, projectName)
	return &shared, nil
}

// CreateSharedWorkflow creates a shared Workflow in scope.
func (s *sharedWorkflowServiceImpl) CreateSharedWorkflow(ctx context.Context, projectName, scope string, req apisv1.SharedWorkflowRequest) (*apisv1.SharedWorkflow, error) {
	namespace, cli, err := s.target(ctx, projectName, scope)
	if err != nil {
		return nil, err
	}
	wf := &wfTypesv1alpha1.Workflow{ObjectMeta: metav1.ObjectMeta{Name: req.Name, Namespace: namespace}}
	if err := setSharedWorkflow(wf, req); err != nil {
		return nil, err
	}
	if err := cli.Create(ctx, wf); err != nil {
		if apierrors.IsAlreadyExists(err) {
			return nil, bcode.ErrSharedWorkflowExists
		}
		return nil, err
	}
	shared, err := sharedWorkflowOf(*wf, scope)
	return &shared, err
}

// UpdateSharedWorkflow replaces the alias, description, modes and steps of the
// shared Workflow named name in scope.
func (s *sharedWorkflowServiceImpl) UpdateSharedWorkflow(ctx context.Context, projectName, scope, name string, req apisv1.SharedWorkflowRequest) (*apisv1.SharedWorkflow, error) {
	namespace, cli, err := s.target(ctx, projectName, scope)
	if err != nil {
		return nil, err
	}
	wf := &wfTypesv1alpha1.Workflow{}
	if err := cli.Get(ctx, types.NamespacedName{Namespace: namespace, Name: name}, wf); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, bcode.ErrSharedWorkflowNotFound
		}
		return nil, err
	}
	if err := setSharedWorkflow(wf, req); err != nil {
		return nil, err
	}
	if err := cli.Update(ctx, wf); err != nil {
		return nil, err
	}
	shared, err := sharedWorkflowOf(*wf, scope)
	return &shared, err
}

// DeleteSharedWorkflow deletes the shared Workflow named name in scope, unless
// an application workflow runs it, in any project.
func (s *sharedWorkflowServiceImpl) DeleteSharedWorkflow(ctx context.Context, projectName, scope, name string) error {
	namespace, cli, err := s.target(ctx, projectName, scope)
	if err != nil {
		return err
	}
	refs, err := s.workflowRefs(ctx)
	if err != nil {
		return err
	}
	if used, elsewhere := usesOf(refs, namespace, name, projectName); len(used) > 0 || elsewhere > 0 {
		return bcode.ErrSharedWorkflowInUse
	}
	wf := &wfTypesv1alpha1.Workflow{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace}}
	if err := cli.Delete(ctx, wf); err != nil {
		if apierrors.IsNotFound(err) {
			return bcode.ErrSharedWorkflowNotFound
		}
		return err
	}
	return nil
}

// target is the namespace of scope and the client that acts on it.
func (s *sharedWorkflowServiceImpl) target(ctx context.Context, projectName, scope string) (string, client.Client, error) {
	switch scope {
	case sharedScopeProject:
		namespace, err := projectNamespace(ctx, s.Store, projectName)
		return namespace, s.KubeClient, err
	case sharedScopeGlobal:
		return velatypes.DefaultKubeVelaNS, s.ServerKubeClient, nil
	default:
		return "", nil, bcode.ErrSharedWorkflowScope
	}
}

// workflowRef is an application workflow that references a shared Workflow,
// with the namespace its Application runs in.
type workflowRef struct {
	use       apisv1.SharedWorkflowUse
	project   string
	ref       string
	namespace string
	// local says the namespace has a Workflow named ref, which KubeVela runs
	// in place of a global one.
	local bool
}

// workflowRefs lists every application workflow that references a shared
// Workflow, in every project.
func (s *sharedWorkflowServiceImpl) workflowRefs(ctx context.Context) ([]workflowRef, error) {
	entities, err := s.Store.List(ctx, &model.Workflow{}, nil)
	if err != nil {
		return nil, err
	}
	envs := map[string]*model.Env{}
	apps := map[string]*model.Application{}
	locals := map[types.NamespacedName]bool{}
	var refs []workflowRef
	for _, entity := range entities {
		workflow := entity.(*model.Workflow)
		if workflow.Ref == "" {
			continue
		}
		env, ok := envs[workflow.EnvName]
		if !ok {
			if env, err = repository.GetEnv(ctx, s.Store, workflow.EnvName); err != nil {
				klog.Warningf("the environment %s of workflow %s/%s: %v", workflow.EnvName, workflow.AppPrimaryKey, workflow.Name, err)
				env = nil
			}
			envs[workflow.EnvName] = env
		}
		if env == nil {
			continue
		}
		app, ok := apps[workflow.AppPrimaryKey]
		if !ok {
			app = &model.Application{Name: workflow.AppPrimaryKey}
			if err := s.Store.Get(ctx, app); err != nil {
				klog.Warningf("the application of workflow %s/%s: %v", workflow.AppPrimaryKey, workflow.Name, err)
				app = nil
			}
			apps[workflow.AppPrimaryKey] = app
		}
		if app == nil {
			continue
		}
		key := types.NamespacedName{Namespace: env.Namespace, Name: workflow.Ref}
		local, ok := locals[key]
		if !ok && env.Namespace != velatypes.DefaultKubeVelaNS {
			err := s.ServerKubeClient.Get(ctx, key, &wfTypesv1alpha1.Workflow{})
			if err != nil && !apierrors.IsNotFound(err) {
				return nil, err
			}
			local = err == nil
			locals[key] = local
		}
		refs = append(refs, workflowRef{
			use: apisv1.SharedWorkflowUse{
				AppName:       app.Name,
				AppAlias:      app.Alias,
				WorkflowName:  workflow.Name,
				WorkflowAlias: workflow.Alias,
				EnvName:       env.Name,
			},
			project:   app.Project,
			ref:       workflow.Ref,
			namespace: env.Namespace,
			local:     local,
		})
	}
	return refs, nil
}

// usesOf is what runs the Workflow namespace/name, as KubeVela resolves a ref:
// in the Application's namespace, else the system namespace. The project's
// workflows are named; other projects' are only counted.
func usesOf(refs []workflowRef, namespace, name, projectName string) ([]apisv1.SharedWorkflowUse, int) {
	var named []apisv1.SharedWorkflowUse
	elsewhere := 0
	for _, r := range refs {
		if r.ref != name {
			continue
		}
		runs := r.namespace == namespace || (namespace == velatypes.DefaultKubeVelaNS && !r.local)
		if !runs {
			continue
		}
		if r.project == projectName {
			named = append(named, r.use)
		} else {
			elsewhere++
		}
	}
	return named, elsewhere
}

// setSharedWorkflow writes req's alias, description, modes and steps into wf.
func setSharedWorkflow(wf *wfTypesv1alpha1.Workflow, req apisv1.SharedWorkflowRequest) error {
	steps, err := assembler.CreateWorkflowStepModel(req.Steps)
	if err != nil {
		return err
	}
	wf.Steps = workflowStepSpecs(steps)
	wf.Mode = nil
	if req.Mode != "" || req.SubMode != "" {
		wf.Mode = &wfTypesv1alpha1.WorkflowExecuteMode{
			Steps:    wfTypesv1alpha1.WorkflowMode(req.Mode),
			SubSteps: wfTypesv1alpha1.WorkflowMode(req.SubMode),
		}
	}
	annotations := wf.GetAnnotations()
	if annotations == nil {
		annotations = map[string]string{}
	}
	for key, value := range map[string]string{annoSharedWorkflowAlias: req.Alias, annoSharedWorkflowDescription: req.Description} {
		if value == "" {
			delete(annotations, key)
		} else {
			annotations[key] = value
		}
	}
	wf.SetAnnotations(annotations)
	return nil
}

// projectNamespace is the namespace of the project named projectName.
func projectNamespace(ctx context.Context, store datastore.DataStore, projectName string) (string, error) {
	project := &model.Project{Name: projectName}
	if err := store.Get(ctx, project); err != nil {
		if errors.Is(err, datastore.ErrRecordNotExist) {
			return "", bcode.ErrProjectIsNotExist
		}
		return "", err
	}
	return project.GetNamespace(), nil
}

// findSharedWorkflow finds the Workflow named ref as KubeVela finds it: in
// namespace, where the Applications run, read as the user; else in the system
// namespace, read as VelaUX, since a global shared workflow is for every
// project whether or not its users can read the system namespace. One found in
// namespace is the project's where namespace is the project's.
func findSharedWorkflow(ctx context.Context, user, server client.Reader, namespace, projectNamespace, ref string) (*wfTypesv1alpha1.Workflow, string, error) {
	shared := &wfTypesv1alpha1.Workflow{}
	err := user.Get(ctx, types.NamespacedName{Namespace: namespace, Name: ref}, shared)
	if err == nil {
		if namespace == projectNamespace {
			return shared, sharedScopeProject, nil
		}
		return shared, sharedScopeEnvironment, nil
	}
	if !apierrors.IsNotFound(err) {
		return nil, "", err
	}
	err = server.Get(ctx, types.NamespacedName{Namespace: velatypes.DefaultKubeVelaNS, Name: ref}, shared)
	if err == nil {
		return shared, sharedScopeGlobal, nil
	}
	if apierrors.IsNotFound(err) {
		return nil, "", bcode.ErrSharedWorkflowNotFound
	}
	return nil, "", err
}

// listSharedWorkflows lists the Workflows in the project's namespace, read as
// the user, then the global ones in the system namespace, read as VelaUX.
// Global ones that cannot be read leave the list with the project's alone,
// saying so.
func listSharedWorkflows(ctx context.Context, user, server client.Reader, namespace string) ([]apisv1.SharedWorkflow, bool, error) {
	local := &wfTypesv1alpha1.WorkflowList{}
	if err := user.List(ctx, local, client.InNamespace(namespace)); err != nil {
		return nil, false, err
	}
	global := &wfTypesv1alpha1.WorkflowList{}
	unavailable := false
	if namespace != velatypes.DefaultKubeVelaNS {
		if err := server.List(ctx, global, client.InNamespace(velatypes.DefaultKubeVelaNS)); err != nil {
			klog.Warningf("global shared workflows could not be listed: %v", err)
			global.Items, unavailable = nil, true
		}
	}
	shared, err := sharedWorkflowsOf(local.Items, global.Items)
	return shared, unavailable, err
}

// sharedWorkflowsOf lists the project's Workflows, then global ones, a global
// one hidden where the project has one of its name.
func sharedWorkflowsOf(local, global []wfTypesv1alpha1.Workflow) ([]apisv1.SharedWorkflow, error) {
	shared := []apisv1.SharedWorkflow{}
	localNames := map[string]bool{}
	for _, item := range local {
		localNames[item.Name] = true
		s, err := sharedWorkflowOf(item, sharedScopeProject)
		if err != nil {
			return nil, err
		}
		shared = append(shared, s)
	}
	for _, item := range global {
		s, err := sharedWorkflowOf(item, sharedScopeGlobal)
		if err != nil {
			return nil, err
		}
		s.Hidden = localNames[item.Name]
		shared = append(shared, s)
	}
	return shared, nil
}

// sharedWorkflowOf is the Workflow wf, found in scope, as the API returns it.
func sharedWorkflowOf(wf wfTypesv1alpha1.Workflow, scope string) (apisv1.SharedWorkflow, error) {
	steps, err := convert.FromCRWorkflowSteps(wf.Steps)
	if err != nil {
		return apisv1.SharedWorkflow{}, err
	}
	s := apisv1.SharedWorkflow{
		Name:        wf.Name,
		Namespace:   wf.Namespace,
		Scope:       scope,
		Alias:       wf.GetAnnotations()[annoSharedWorkflowAlias],
		Description: wf.GetAnnotations()[annoSharedWorkflowDescription],
		Steps:       []apisv1.WorkflowStep{},
	}
	for _, step := range steps {
		s.Steps = append(s.Steps, assembler.ConvertFromWorkflowStepModel(step))
	}
	if wf.Mode != nil {
		s.Mode = string(wf.Mode.Steps)
		s.SubMode = string(wf.Mode.SubSteps)
	}
	return s, nil
}
