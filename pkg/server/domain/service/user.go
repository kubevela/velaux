/*
Copyright 2022 The KubeVela Authors.

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

	"github.com/oam-dev/kubevela/pkg/multicluster"

	"golang.org/x/crypto/bcrypt"
	"helm.sh/helm/v3/pkg/time"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	pkgUtils "github.com/oam-dev/kubevela/pkg/utils"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// UserService User manage api
type UserService interface {
	AdminConfigured(ctx context.Context) (apisv1.AdminConfiguredResponse, error)
	InitAdmin(ctx context.Context, req apisv1.InitAdminRequest) (apisv1.InitAdminResponse, error)
	GetFirstAdmin(ctx context.Context) (*model.User, error)
	GetUser(ctx context.Context, username string) (*model.User, error)
	DetailUser(ctx context.Context, user *model.User) (*apisv1.DetailUserResponse, error)
	DeleteUser(ctx context.Context, username string) error
	CreateUser(ctx context.Context, req apisv1.CreateUserRequest) (*apisv1.UserBase, error)
	UpdateUser(ctx context.Context, user *model.User, req apisv1.UpdateUserRequest) (*apisv1.UserBase, error)
	ListUsers(ctx context.Context, page, pageSize int, listOptions apisv1.ListUserOptions) (*apisv1.ListUserResponse, error)
	DisableUser(ctx context.Context, user *model.User) error
	EnableUser(ctx context.Context, user *model.User) error
	DetailLoginUserInfo(ctx context.Context) (*apisv1.LoginUserInfoResponse, error)
	UpdateUserLoginTime(ctx context.Context, user *model.User) error
}

type userServiceImpl struct {
	Store          datastore.DataStore `inject:"datastore"`
	K8sClient      client.Client       `inject:"kubeClient"`
	ProjectService ProjectService      `inject:""`
	RbacService    RBACService         `inject:""`
	SysService     SystemInfoService   `inject:""`
	TargetService  TargetService       `inject:""`
	EnvService     EnvService          `inject:""`
}

// NewUserService new User service
func NewUserService() UserService {
	return &userServiceImpl{}
}

// AdminConfigured check if admin user is initialized
func (u *userServiceImpl) AdminConfigured(ctx context.Context) (apisv1.AdminConfiguredResponse, error) {
	users, err := u.Store.List(ctx, &model.User{}, nil)
	if err != nil {
		return apisv1.AdminConfiguredResponse{Configured: true}, err
	}
	if len(users) == 0 {
		return apisv1.AdminConfiguredResponse{Configured: false}, nil
	}
	return apisv1.AdminConfiguredResponse{Configured: true}, nil
}

// InitAdmin initialize admin user
func (u *userServiceImpl) InitAdmin(ctx context.Context, req apisv1.InitAdminRequest) (apisv1.InitAdminResponse, error) {
	preCheck, err := u.AdminConfigured(ctx)
	if err != nil {
		return apisv1.InitAdminResponse{}, err
	}
	if preCheck.Configured {
		return apisv1.InitAdminResponse{}, bcode.ErrAdminAlreadyConfigured
	}

	createUserRequest := apisv1.CreateUserRequest{
		Name:     req.Name,
		Password: req.Password,
		Email:    req.Email,
		Roles:    []string{AdminRole},
		Alias:    model.DefaultAdminUserAlias,
	}
	if _, err = u.CreateUser(ctx, createUserRequest); err != nil {
		return apisv1.InitAdminResponse{}, err
	}
	klog.Info("first admin user initialized")
	if err = u.InitDefaultProjectEnvTarget(ctx, model.DefaultInitNamespace, req.Name); err != nil {
		return apisv1.InitAdminResponse{}, err
	}
	return apisv1.InitAdminResponse{Success: true}, nil
}

func (u *userServiceImpl) InitDefaultProjectEnvTarget(ctx context.Context, defaultNamespace string, adminUser string) error {
	var project = model.Project{}
	entities, err := u.Store.List(ctx, &project, &datastore.ListOptions{FilterOptions: datastore.FilterOptions{}})
	if err != nil {
		return fmt.Errorf("initialize project failed %w", err)
	}
	if len(entities) > 0 {
		for _, project := range entities {
			pro := project.(*model.Project)
			pro.Owner = adminUser
			if err := u.Store.Put(ctx, pro); err != nil {
				return err
			}
			if err := u.RbacService.SyncDefaultRoleAndUsersForProject(ctx, pro); err != nil {
				return fmt.Errorf("fail to sync the default role and users for the project %s %w", pro.Name, err)
			}
		}
		return nil
	}

	count, _ := u.Store.Count(ctx, &project, nil)
	if count > 0 {
		return nil
	}
	klog.Info("no default project found, adding a default project with default env and target")

	_, err = u.ProjectService.CreateProject(ctx, apisv1.CreateProjectRequest{
		Name:        model.DefaultInitName,
		Alias:       "Default",
		Description: model.DefaultProjectDescription,
		Owner:       adminUser,
	})
	if err != nil {
		return fmt.Errorf("initialize project failed %w", err)
	}

	// initialize default target first
	_, err = u.TargetService.CreateTarget(ctx, apisv1.CreateTargetRequest{
		Name:        model.DefaultInitName,
		Alias:       "Default",
		Description: model.DefaultTargetDescription,
		Project:     model.DefaultInitName,
		Cluster: &apisv1.ClusterTarget{
			ClusterName: multicluster.ClusterLocalName,
			Namespace:   defaultNamespace,
		},
	})

	// for idempotence, ignore default target already exist error
	if err != nil && errors.Is(err, bcode.ErrTargetExist) {
		return fmt.Errorf("initialize default target failed %w", err)
	}

	// initialize default target first
	_, err = u.EnvService.CreateEnv(ctx, apisv1.CreateEnvRequest{
		Name:        model.DefaultInitName,
		Alias:       "Default",
		Description: model.DefaultEnvDescription,
		Project:     model.DefaultInitName,
		Namespace:   defaultNamespace,
		Targets:     []string{model.DefaultInitName},
	})
	// for idempotence, ignore default env already exist error
	if err != nil && errors.Is(err, bcode.ErrEnvAlreadyExists) {
		return fmt.Errorf("initialize default environment failed %w", err)
	}
	return nil
}

func (u *userServiceImpl) GetFirstAdmin(ctx context.Context) (*model.User, error) {
	users, err := u.Store.List(ctx, &model.User{}, &datastore.ListOptions{FilterOptions: datastore.FilterOptions{}})
	if err != nil {
		return nil, err
	}
	for _, user := range users {
		if modelUser := user.(*model.User); modelUser != nil && modelUser.IsAdmin() {
			return modelUser, nil
		}
	}
	return nil, bcode.ErrNoAdminUser
}

// GetUser get user
func (u *userServiceImpl) GetUser(ctx context.Context, username string) (*model.User, error) {
	user := &model.User{
		Name: username,
	}
	if err := u.Store.Get(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

// DetailUser return user detail
func (u *userServiceImpl) DetailUser(ctx context.Context, user *model.User) (*apisv1.DetailUserResponse, error) {
	roles, err := u.RbacService.ListRole(ctx, "", 0, 0)
	if err != nil {
		klog.Warningf("list platform roles failure %s", err.Error())
	}
	detailUser := convertUserModel(user, roles)
	_, projects, err := u.GenerateUserProjects(ctx, user)
	if err != nil {
		return nil, err
	}
	detailUser.Projects = projects
	return detailUser, nil
}

func (u *userServiceImpl) GenerateUserProjects(ctx context.Context, user *model.User) ([]datastore.Entity, []*apisv1.UserProjectBase, error) {
	pUser := &model.ProjectUser{
		Username: user.Name,
	}
	projectUsers, err := u.Store.List(ctx, pUser, &datastore.ListOptions{
		SortBy: []datastore.SortOption{{Key: "createTime", Order: datastore.SortOrderDescending}},
	})
	if err != nil {
		return nil, nil, err
	}
	var projects []*apisv1.UserProjectBase
	for _, v := range projectUsers {
		pu, ok := v.(*model.ProjectUser)
		if !ok {
			klog.Errorf("failed to convert project user")
			continue
		}
		project, err := u.ProjectService.DetailProject(ctx, pu.ProjectName)
		if err != nil {
			klog.Errorf("failed to delete project(%s) info: %s", pu.ProjectName, err.Error())
			continue
		}
		roles, err := u.RbacService.ListRole(ctx, project.Name, 0, 0)
		if err != nil {
			klog.Errorf("failed to list project(%s) roles: %s", project.Name, err.Error())
			continue
		}

		var roleAlias = make(map[string]string)
		for _, r := range roles.Roles {
			roleAlias[r.Name] = r.Alias
		}
		projects = append(projects, &apisv1.UserProjectBase{
			Name:        project.Name,
			Alias:       project.Alias,
			Owner:       project.Owner,
			Description: project.Description,
			JoinTime:    pu.CreateTime,
			Roles: func() []apisv1.NameAlias {
				var roles []apisv1.NameAlias
				for _, r := range pu.UserRoles {
					roles = append(roles, apisv1.NameAlias{
						Name:  r,
						Alias: roleAlias[r],
					})
				}
				return roles
			}(),
		})
	}
	return projectUsers, projects, nil
}

// DeleteUser delete user
func (u *userServiceImpl) DeleteUser(ctx context.Context, username string) error {
	pUser := &model.ProjectUser{
		Username: username,
	}

	projectUsers, err := u.Store.List(ctx, pUser, &datastore.ListOptions{})
	if err != nil {
		return err
	}
	for _, v := range projectUsers {
		pu := v.(*model.ProjectUser)
		if err := u.Store.Delete(ctx, pu); err != nil {
			klog.Errorf("failed to delete project user %s: %s", pu.PrimaryKey(), err.Error())
		}
	}
	if err := u.Store.Delete(ctx, &model.User{Name: username}); err != nil {
		klog.Errorf("failed to delete user %s %v", pkgUtils.Sanitize(username), err.Error())
		return err
	}
	return nil
}

// CreateUser create user
func (u *userServiceImpl) CreateUser(ctx context.Context, req apisv1.CreateUserRequest) (*apisv1.UserBase, error) {
	sysInfo, err := u.SysService.Get(ctx)
	if err != nil {
		return nil, err
	}
	if sysInfo.LoginType == model.LoginTypeDex {
		return nil, bcode.ErrUserCannotModified
	}
	hash, err := GeneratePasswordHash(req.Password)
	if err != nil {
		return nil, err
	}

	// TODO: validate the roles, they must be platform roles
	user := &model.User{
		Name:      req.Name,
		Alias:     req.Alias,
		Email:     req.Email,
		UserRoles: req.Roles,
		Password:  hash,
		Disabled:  false,
	}
	if err := u.Store.Add(ctx, user); err != nil {
		return nil, err
	}
	return convertUserBase(user), nil
}

// UpdateUser update user
func (u *userServiceImpl) UpdateUser(ctx context.Context, user *model.User, req apisv1.UpdateUserRequest) (*apisv1.UserBase, error) {
	sysInfo, err := u.SysService.Get(ctx)
	if err != nil {
		return nil, err
	}
	if req.Alias != "" {
		user.Alias = req.Alias
	}
	if sysInfo.LoginType != model.LoginTypeDex {
		if req.Password != "" {
			hash, err := GeneratePasswordHash(req.Password)
			if err != nil {
				return nil, err
			}
			user.Password = hash
		}
	}
	if req.Email != "" {
		if user.Email != "" {
			return nil, bcode.ErrUnsupportedEmailModification
		}
		user.Email = req.Email
	}

	// TODO: validate the roles, they must be platform roles
	if req.Roles != nil {
		user.UserRoles = *req.Roles
	}
	if err := u.Store.Put(ctx, user); err != nil {
		return nil, err
	}
	return convertUserBase(user), nil
}

// ListUsers list users
func (u *userServiceImpl) ListUsers(ctx context.Context, page, pageSize int, listOptions apisv1.ListUserOptions) (*apisv1.ListUserResponse, error) {
	user := &model.User{}
	var queries []datastore.FuzzyQueryOption
	if listOptions.Name != "" {
		queries = append(queries, datastore.FuzzyQueryOption{Key: "name", Query: listOptions.Name})
	}
	if listOptions.Email != "" {
		queries = append(queries, datastore.FuzzyQueryOption{Key: "email", Query: listOptions.Email})
	}
	if listOptions.Alias != "" {
		queries = append(queries, datastore.FuzzyQueryOption{Key: "alias", Query: listOptions.Alias})
	}
	fo := datastore.FilterOptions{Queries: queries}

	var userList []*apisv1.DetailUserResponse
	users, err := u.Store.List(ctx, user, &datastore.ListOptions{
		Page:          page,
		PageSize:      pageSize,
		SortBy:        []datastore.SortOption{{Key: "createTime", Order: datastore.SortOrderDescending}},
		FilterOptions: fo,
	})
	if err != nil {
		return nil, err
	}
	roles, err := u.RbacService.ListRole(ctx, "", 0, 0)
	if err != nil {
		klog.Warningf("list platform roles failure %s", err.Error())
	}
	for _, v := range users {
		user, ok := v.(*model.User)
		if ok {
			userList = append(userList, convertUserModel(user, roles))
		}
	}
	count, err := u.Store.Count(ctx, user, &fo)
	if err != nil {
		return nil, err
	}

	return &apisv1.ListUserResponse{
		Users: userList,
		Total: count,
	}, nil
}

// DisableUser disable user
func (u *userServiceImpl) DisableUser(ctx context.Context, user *model.User) error {
	if user.Disabled {
		return bcode.ErrUserAlreadyDisabled
	}
	user.Disabled = true
	return u.Store.Put(ctx, user)
}

// EnableUser disable user
func (u *userServiceImpl) EnableUser(ctx context.Context, user *model.User) error {
	if !user.Disabled {
		return bcode.ErrUserAlreadyEnabled
	}
	user.Disabled = false
	return u.Store.Put(ctx, user)
}

// UpdateUserLoginTime update user login time
func (u *userServiceImpl) UpdateUserLoginTime(ctx context.Context, user *model.User) error {
	user.LastLoginTime = time.Now().Time
	return u.Store.Put(ctx, user)
}

// DetailLoginUserInfo get projects and permission policies of login user
func (u *userServiceImpl) DetailLoginUserInfo(ctx context.Context) (*apisv1.LoginUserInfoResponse, error) {
	userName, ok := ctx.Value(&apisv1.CtxKeyUser).(string)
	if !ok {
		return nil, bcode.ErrUnauthorized
	}
	user, err := u.GetUser(ctx, userName)
	if !ok {
		klog.Errorf("get login user model failure %s", err.Error())
		return nil, bcode.ErrUnauthorized
	}
	projectModels, userProjects, err := u.GenerateUserProjects(ctx, user)
	if err != nil {
		return nil, err
	}
	var projectPermissions = make(map[string][]apisv1.PermissionBase)
	for _, p := range projectModels {
		project := p.(*model.ProjectUser)
		perms, err := u.RbacService.GetUserPermissions(ctx, user, project.ProjectName, false)
		if err != nil {
			klog.Errorf("list user %s perm policies from project %s failure %s", user.Name, project.ProjectName, err.Error())
			continue
		}
		projectPermissions[project.ProjectName] = func() (list []apisv1.PermissionBase) {
			for _, perm := range perms {
				list = append(list, apisv1.PermissionBase{
					Name:       perm.Name,
					Alias:      perm.Alias,
					Resources:  perm.Resources,
					Actions:    perm.Actions,
					Effect:     perm.Effect,
					CreateTime: perm.CreateTime,
					UpdateTime: perm.UpdateTime,
				})
			}
			return
		}()
	}
	perms, err := u.RbacService.GetUserPermissions(ctx, user, "", true)
	if err != nil {
		klog.Errorf("list user %s  platform perm policies failure %s", user.Name, err.Error())
	}
	var platformPermissions []apisv1.PermissionBase
	for _, perm := range perms {
		platformPermissions = append(platformPermissions, apisv1.PermissionBase{
			Name:       perm.Name,
			Alias:      perm.Alias,
			Resources:  perm.Resources,
			Actions:    perm.Actions,
			Effect:     perm.Effect,
			CreateTime: perm.CreateTime,
			UpdateTime: perm.UpdateTime,
		})
	}

	return &apisv1.LoginUserInfoResponse{
		UserBase:            *convertUserBase(user),
		Projects:            userProjects,
		ProjectPermissions:  projectPermissions,
		PlatformPermissions: platformPermissions,
	}, nil
}

func convertUserModel(user *model.User, roles *apisv1.ListRolesResponse) *apisv1.DetailUserResponse {
	var nameAlias = make(map[string]string)
	if roles != nil {
		for _, role := range roles.Roles {
			nameAlias[role.Name] = role.Alias
		}
	}
	return &apisv1.DetailUserResponse{
		UserBase: *convertUserBase(user),
		Roles: func() (list []apisv1.NameAlias) {
			for _, r := range user.UserRoles {
				list = append(list, apisv1.NameAlias{Name: r, Alias: nameAlias[r]})
			}
			return
		}(),
		Projects: make([]*apisv1.UserProjectBase, 0),
	}
}

func convertUserBase(user *model.User) *apisv1.UserBase {
	return &apisv1.UserBase{
		Name:          user.Name,
		Alias:         user.Alias,
		Email:         user.Email,
		CreateTime:    user.CreateTime,
		LastLoginTime: user.LastLoginTime,
		Disabled:      user.Disabled,
	}
}

// GeneratePasswordHash generate password hash
func GeneratePasswordHash(s string) (string, error) {
	if s == "" {
		return "", bcode.ErrUserInvalidPassword
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(s), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hashed), nil
}

func compareHashWithPassword(hash, password string) error {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
		return bcode.ErrUserInconsistentPassword
	}
	return err
}

// NewTestUserService create the user service instance for testing
func NewTestUserService(ds datastore.DataStore, c client.Client) UserService {
	return &userServiceImpl{
		Store:          ds,
		K8sClient:      c,
		ProjectService: NewTestProjectService(ds, c),
		RbacService:    &rbacServiceImpl{Store: ds},
		TargetService:  NewTestTargetService(ds, c),
		SysService:     &systemInfoServiceImpl{Store: ds, KubeClient: c},
		EnvService:     NewTestEnvService(ds, c),
	}
}
