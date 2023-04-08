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

package service

import (
	"bytes"
	"context"
	"errors"

	terraformapi "github.com/oam-dev/terraform-controller/api/v1beta1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/auth"
	"github.com/oam-dev/kubevela/pkg/utils"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	apiutils "github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// ProjectService project manage service.
type ProjectService interface {
	GetProject(ctx context.Context, projectName string) (*model.Project, error)
	DetailProject(ctx context.Context, projectName string) (*apisv1.ProjectBase, error)
	ListProjects(ctx context.Context, page, pageSize int) (*apisv1.ListProjectResponse, error)
	ListUserProjects(ctx context.Context, userName string) ([]*apisv1.ProjectBase, error)
	CreateProject(ctx context.Context, req apisv1.CreateProjectRequest) (*apisv1.ProjectBase, error)
	DeleteProject(ctx context.Context, projectName string) error
	UpdateProject(ctx context.Context, projectName string, req apisv1.UpdateProjectRequest) (*apisv1.ProjectBase, error)
	ListProjectUser(ctx context.Context, projectName string, page, pageSize int) (*apisv1.ListProjectUsersResponse, error)
	AddProjectUser(ctx context.Context, projectName string, req apisv1.AddProjectUserRequest) (*apisv1.ProjectUserBase, error)
	DeleteProjectUser(ctx context.Context, projectName string, userName string) error
	UpdateProjectUser(ctx context.Context, projectName string, userName string, req apisv1.UpdateProjectUserRequest) (*apisv1.ProjectUserBase, error)
	ListTerraformProviders(ctx context.Context, projectName string) ([]*apisv1.TerraformProvider, error)
}

type projectServiceImpl struct {
	Store         datastore.DataStore `inject:"datastore"`
	K8sClient     client.Client       `inject:"kubeClient"`
	RbacService   RBACService         `inject:""`
	TargetService TargetService       `inject:""`
	UserService   UserService         `inject:""`
	EnvService    EnvService          `inject:""`
}

// NewProjectService new project service
func NewProjectService() ProjectService {
	return &projectServiceImpl{}
}

// GetProject get project
func (p *projectServiceImpl) GetProject(ctx context.Context, projectName string) (*model.Project, error) {
	project := &model.Project{Name: projectName}
	if err := p.Store.Get(ctx, project); err != nil {
		if errors.Is(err, datastore.ErrRecordNotExist) {
			return nil, bcode.ErrProjectIsNotExist
		}
		return nil, err
	}
	if _, err := utils.GetNamespace(ctx, p.K8sClient, project.GetNamespace()); err != nil {
		if apierrors.IsNotFound(err) {
			if err := utils.CreateNamespace(ctx, p.K8sClient, projectName); err != nil && !apierrors.IsAlreadyExists(err) {
				return nil, bcode.ErrProjectNamespaceFail
			}
		}
	}
	return project, nil
}

func (p *projectServiceImpl) DetailProject(ctx context.Context, projectName string) (*apisv1.ProjectBase, error) {
	project, err := p.GetProject(ctx, projectName)
	if err != nil {
		return nil, err
	}
	var user = &model.User{Name: project.Owner}
	if project.Owner != "" {
		if err := p.Store.Get(ctx, user); err != nil {
			klog.Warningf("get project owner %s info failure %s", project.Owner, err.Error())
		}
	}
	return ConvertProjectModel2Base(project, user), nil
}

func listProjects(ctx context.Context, ds datastore.DataStore, page, pageSize int) (*apisv1.ListProjectResponse, error) {
	var project = model.Project{}
	entities, err := ds.List(ctx, &project, &datastore.ListOptions{Page: page, PageSize: pageSize, SortBy: []datastore.SortOption{{Key: "createTime", Order: datastore.SortOrderDescending}}})
	if err != nil {
		return nil, err
	}
	var projects []*apisv1.ProjectBase
	for _, entity := range entities {
		project := entity.(*model.Project)
		var user = &model.User{Name: project.Owner}
		if project.Owner != "" {
			if err := ds.Get(ctx, user); err != nil {
				klog.Warningf("get project owner %s info failure %s", project.Owner, err.Error())
			}
		}
		projects = append(projects, ConvertProjectModel2Base(project, user))
	}
	total, err := ds.Count(ctx, &project, nil)
	if err != nil {
		return nil, err
	}
	return &apisv1.ListProjectResponse{Projects: projects, Total: total}, nil
}

func (p *projectServiceImpl) ListUserProjects(ctx context.Context, userName string) ([]*apisv1.ProjectBase, error) {
	var projectUser = model.ProjectUser{
		Username: userName,
	}
	entities, err := p.Store.List(ctx, &projectUser, nil)
	if err != nil {
		return nil, err
	}
	var projectNames []string
	for _, entity := range entities {
		projectNames = append(projectNames, entity.(*model.ProjectUser).ProjectName)
	}
	if len(projectNames) == 0 {
		return []*apisv1.ProjectBase{}, nil
	}
	projectEntities, err := p.Store.List(ctx, &model.Project{}, &datastore.ListOptions{FilterOptions: datastore.FilterOptions{In: []datastore.InQueryOption{{
		Key:    "name",
		Values: projectNames,
	}}}})
	if err != nil {
		return nil, err
	}
	var projectBases []*apisv1.ProjectBase
	for _, entity := range projectEntities {
		projectBases = append(projectBases, ConvertProjectModel2Base(entity.(*model.Project), nil))
	}
	return projectBases, nil
}

// ListProjects list projects
func (p *projectServiceImpl) ListProjects(ctx context.Context, page, pageSize int) (*apisv1.ListProjectResponse, error) {
	return listProjects(ctx, p.Store, page, pageSize)
}

// DeleteProject delete a project
func (p *projectServiceImpl) DeleteProject(ctx context.Context, name string) error {
	_, err := p.GetProject(ctx, name)
	if err != nil {
		return err
	}

	count, err := p.Store.Count(ctx, &model.Application{Project: name}, nil)
	if err != nil {
		return err
	}
	if count > 0 {
		return bcode.ErrProjectDenyDeleteByApplication
	}

	count, err = p.Store.Count(ctx, &model.Target{Project: name}, nil)
	if err != nil {
		return err
	}
	if count > 0 {
		return bcode.ErrProjectDenyDeleteByTarget
	}

	count, err = p.Store.Count(ctx, &model.Env{Project: name}, nil)
	if err != nil {
		return err
	}
	if count > 0 {
		return bcode.ErrProjectDenyDeleteByEnvironment
	}

	users, _ := p.ListProjectUser(ctx, name, 0, 0)
	for _, user := range users.Users {
		err := p.DeleteProjectUser(ctx, name, user.UserName)
		if err != nil {
			return err
		}
	}

	roles, _ := p.RbacService.ListRole(ctx, name, 0, 0)
	for _, role := range roles.Roles {
		err := p.RbacService.DeleteRole(ctx, name, role.Name)
		if err != nil {
			return err
		}
	}

	permissions, _ := p.RbacService.ListPermissions(ctx, name)
	for _, perm := range permissions {
		err := p.RbacService.DeletePermission(ctx, name, perm.Name)
		if err != nil {
			return err
		}
	}
	if err := p.Store.Delete(ctx, &model.Project{Name: name}); err != nil {
		return err
	}

	if err := managePrivilegesForProject(ctx, p.K8sClient, &model.Project{Name: name}, true); err != nil {
		return err
	}
	return nil
}

// CreateProject create project
func (p *projectServiceImpl) CreateProject(ctx context.Context, req apisv1.CreateProjectRequest) (*apisv1.ProjectBase, error) {
	exist, err := p.Store.IsExist(ctx, &model.Project{Name: req.Name})
	if err != nil {
		klog.Errorf("check project name is exist failure %s", err.Error())
		return nil, bcode.ErrProjectIsExist
	}
	if exist {
		return nil, bcode.ErrProjectIsExist
	}
	owner := req.Owner
	if owner == "" {
		loginUserName, ok := ctx.Value(&apisv1.CtxKeyUser).(string)
		if ok {
			owner = loginUserName
		}
	}
	var user = &model.User{Name: owner}
	if owner != "" {
		if err := p.Store.Get(ctx, user); err != nil {
			return nil, bcode.ErrProjectOwnerInvalid
		}
	}

	namespace := req.Namespace
	if namespace == "" {
		namespace = req.Name
	}
	createCtx := apiutils.WithProject(ctx, "")
	if err := utils.CreateNamespace(createCtx, p.K8sClient, namespace); err != nil && !apierrors.IsAlreadyExists(err) {
		return nil, bcode.ErrProjectNamespaceFail
	}
	newProject := &model.Project{
		Name:        req.Name,
		Description: req.Description,
		Alias:       req.Alias,
		Owner:       owner,
		Namespace:   namespace,
	}

	if err := p.Store.Add(ctx, newProject); err != nil {
		return nil, err
	}

	if err := managePrivilegesForProject(createCtx, p.K8sClient, newProject, false); err != nil {
		return nil, err
	}

	if err := p.RbacService.SyncDefaultRoleAndUsersForProject(ctx, newProject); err != nil {
		klog.Errorf("fail to sync the default role and users for the project: %s", err.Error())
	}

	return ConvertProjectModel2Base(newProject, user), nil
}

// managePrivilegesForProject grant or revoke privileges for project
func managePrivilegesForProject(ctx context.Context, cli client.Client, project *model.Project, revoke bool) error {
	p := &auth.ApplicationPrivilege{Cluster: types.ClusterLocalName, Namespace: project.Namespace}
	identity := &auth.Identity{Groups: []string{apiutils.KubeVelaProjectGroupPrefix + project.Name}}
	writer := &bytes.Buffer{}
	f, msg := auth.GrantPrivileges, "GrantPrivileges"
	if revoke {
		f, msg = auth.RevokePrivileges, "RevokePrivileges"
	}
	if err := f(ctx, cli, []auth.PrivilegeDescription{p}, identity, writer); err != nil {
		return err
	}
	klog.Infof("%s: %s", msg, writer.String())
	return nil
}

// UpdateProject update project
func (p *projectServiceImpl) UpdateProject(ctx context.Context, projectName string, req apisv1.UpdateProjectRequest) (*apisv1.ProjectBase, error) {
	project, err := p.GetProject(ctx, projectName)
	if err != nil {
		return nil, err
	}
	project.Alias = req.Alias
	project.Description = req.Description
	var user = &model.User{Name: req.Owner}
	if req.Owner != "" {
		if err := p.Store.Get(ctx, user); err != nil {
			if errors.Is(err, datastore.ErrRecordNotExist) {
				return nil, bcode.ErrProjectOwnerInvalid
			}
			return nil, err
		}
		if _, err := p.AddProjectUser(ctx, projectName, apisv1.AddProjectUserRequest{
			UserName:  req.Owner,
			UserRoles: []string{"project-admin"},
		}); err != nil && !errors.Is(err, bcode.ErrProjectUserExist) {
			return nil, err
		}
		project.Owner = req.Owner
	}
	err = p.Store.Put(ctx, project)
	if err != nil {
		return nil, err
	}
	if err := managePrivilegesForProject(ctx, p.K8sClient, project, false); err != nil {
		return nil, err
	}
	return ConvertProjectModel2Base(project, user), nil
}

func (p *projectServiceImpl) ListProjectUser(ctx context.Context, projectName string, page, pageSize int) (*apisv1.ListProjectUsersResponse, error) {
	var projectUser = model.ProjectUser{
		ProjectName: projectName,
	}
	entities, err := p.Store.List(ctx, &projectUser, &datastore.ListOptions{Page: page, PageSize: pageSize, SortBy: []datastore.SortOption{{Key: "createTime", Order: datastore.SortOrderDescending}}})
	if err != nil {
		return nil, err
	}
	var usernames []string
	for _, entity := range entities {
		usernames = append(usernames, entity.(*model.ProjectUser).Username)
	}
	var userMap = make(map[string]*model.User, len(usernames))
	if len(usernames) > 0 {
		users, _ := p.Store.List(ctx, &model.User{}, &datastore.ListOptions{
			FilterOptions: datastore.FilterOptions{
				In: []datastore.InQueryOption{
					{Key: "name", Values: usernames},
				},
			},
		})
		for i := range users {
			user := users[i].(*model.User)
			userMap[user.Name] = user
		}
	}
	var res apisv1.ListProjectUsersResponse
	for _, entity := range entities {
		projectUser := entity.(*model.ProjectUser)
		res.Users = append(res.Users, ConvertProjectUserModel2Base(projectUser, userMap[projectUser.Username]))
	}
	count, err := p.Store.Count(ctx, &projectUser, nil)
	if err != nil {
		return nil, err
	}
	res.Total = count
	return &res, nil
}

func (p *projectServiceImpl) AddProjectUser(ctx context.Context, projectName string, req apisv1.AddProjectUserRequest) (*apisv1.ProjectUserBase, error) {
	project, err := p.GetProject(ctx, projectName)
	if err != nil {
		return nil, err
	}
	user, err := p.UserService.GetUser(ctx, req.UserName)
	if err != nil {
		return nil, err
	}
	// check user roles
	for _, role := range req.UserRoles {
		var projectUser = model.Role{
			Name:    role,
			Project: projectName,
		}
		if err := p.Store.Get(ctx, &projectUser); err != nil {
			return nil, bcode.ErrProjectRoleCheckFailure
		}
		if projectUser.Project != "" && projectUser.Project != projectName {
			return nil, bcode.ErrProjectRoleCheckFailure
		}
	}
	var projectUser = model.ProjectUser{
		Username:    req.UserName,
		ProjectName: project.Name,
		UserRoles:   req.UserRoles,
	}
	if err := p.Store.Add(ctx, &projectUser); err != nil {
		if errors.Is(err, datastore.ErrRecordExist) {
			return nil, bcode.ErrProjectUserExist
		}
		return nil, err
	}
	return ConvertProjectUserModel2Base(&projectUser, user), nil
}

func (p *projectServiceImpl) DeleteProjectUser(ctx context.Context, projectName string, userName string) error {
	project, err := p.GetProject(ctx, projectName)
	if err != nil {
		return err
	}
	var projectUser = model.ProjectUser{
		Username:    userName,
		ProjectName: project.Name,
	}
	if err := p.Store.Delete(ctx, &projectUser); err != nil {
		if errors.Is(err, datastore.ErrRecordExist) {
			return bcode.ErrProjectUserExist
		}
		return err
	}
	return nil
}

func (p *projectServiceImpl) UpdateProjectUser(ctx context.Context, projectName string, userName string, req apisv1.UpdateProjectUserRequest) (*apisv1.ProjectUserBase, error) {
	project, err := p.GetProject(ctx, projectName)
	if err != nil {
		return nil, err
	}
	user, err := p.UserService.GetUser(ctx, userName)
	if err != nil {
		return nil, err
	}
	// check user roles
	for _, role := range req.UserRoles {
		var projectUser = model.Role{
			Name:    role,
			Project: projectName,
		}
		if err := p.Store.Get(ctx, &projectUser); err != nil {
			return nil, bcode.ErrProjectRoleCheckFailure
		}
		if projectUser.Project != "" && projectUser.Project != projectName {
			return nil, bcode.ErrProjectRoleCheckFailure
		}
	}
	var projectUser = model.ProjectUser{
		Username:    userName,
		ProjectName: project.Name,
	}
	if err := p.Store.Get(ctx, &projectUser); err != nil {
		if errors.Is(err, datastore.ErrRecordExist) {
			return nil, bcode.ErrProjectUserExist
		}
		return nil, err
	}
	projectUser.UserRoles = req.UserRoles
	if err := p.Store.Put(ctx, &projectUser); err != nil {
		return nil, err
	}
	return ConvertProjectUserModel2Base(&projectUser, user), nil
}

func (p *projectServiceImpl) ListTerraformProviders(ctx context.Context, projectName string) ([]*apisv1.TerraformProvider, error) {
	l := &terraformapi.ProviderList{}
	listCtx := apiutils.WithProject(ctx, "")
	if err := p.K8sClient.List(listCtx, l, client.InNamespace(types.ProviderNamespace)); err != nil {
		if meta.IsNoMatchError(err) {
			return []*apisv1.TerraformProvider{}, nil
		}
		return nil, err
	}
	var res []*apisv1.TerraformProvider
	for _, provider := range l.Items {
		res = append(res, &apisv1.TerraformProvider{
			Name:       provider.Name,
			Region:     provider.Spec.Region,
			Provider:   provider.Spec.Provider,
			CreateTime: provider.CreationTimestamp.Time,
		})
	}
	return res, nil
}

// ConvertProjectModel2Base convert project model to base struct
func ConvertProjectModel2Base(project *model.Project, owner *model.User) *apisv1.ProjectBase {
	base := &apisv1.ProjectBase{
		Name:        project.Name,
		Description: project.Description,
		Alias:       project.Alias,
		CreateTime:  project.CreateTime,
		UpdateTime:  project.UpdateTime,
		Owner:       apisv1.NameAlias{Name: project.Owner},
		Namespace:   project.GetNamespace(),
	}
	if owner != nil && owner.Name == project.Owner {
		base.Owner = apisv1.NameAlias{Name: owner.Name, Alias: owner.Alias}
	}
	return base
}

// ConvertProjectUserModel2Base convert project user model to base struct
func ConvertProjectUserModel2Base(user *model.ProjectUser, userModel *model.User) *apisv1.ProjectUserBase {
	base := &apisv1.ProjectUserBase{
		UserName:   user.Username,
		UserRoles:  user.UserRoles,
		CreateTime: user.CreateTime,
		UpdateTime: user.UpdateTime,
	}
	if userModel != nil {
		base.UserAlias = userModel.Alias
	}
	return base
}

// NewTestProjectService create the project service instance for testing
func NewTestProjectService(ds datastore.DataStore, c client.Client) ProjectService {
	targetService := &targetServiceImpl{K8sClient: c, Store: ds}
	envService := &envServiceImpl{KubeClient: c, Store: ds}
	rbacService := &rbacServiceImpl{Store: ds}
	userService := &userServiceImpl{Store: ds, RbacService: rbacService, SysService: systemInfoServiceImpl{Store: ds}, EnvService: envService, TargetService: targetService}
	projectService := &projectServiceImpl{
		K8sClient:     c,
		Store:         ds,
		RbacService:   rbacService,
		TargetService: targetService,
		UserService:   userService,
		EnvService:    envService,
	}
	userService.ProjectService = projectService
	envService.ProjectService = projectService
	return projectService
}
