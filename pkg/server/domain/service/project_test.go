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
	"context"

	"github.com/google/go-cmp/cmp"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"

	"github.com/oam-dev/kubevela/pkg/oam/util"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

var _ = Describe("Test project service functions", func() {
	var (
		defaultNamespace = "project-default-ns1-test"
	)
	BeforeEach(func() {
		ds, err := NewDatastore(datastore.Config{Type: "kubeapi", Database: "target-test-kubevela"})
		Expect(ds).ToNot(BeNil())
		Expect(err).Should(BeNil())
		var ns = corev1.Namespace{}
		ns.Name = defaultNamespace
		err = k8sClient.Create(context.TODO(), &ns)
		Expect(err).Should(SatisfyAny(BeNil(), &util.AlreadyExistMatcher{}))
		projectService = NewTestProjectService(ds, k8sClient).(*projectServiceImpl)
		envService = projectService.EnvService.(*envServiceImpl)
		userService = projectService.UserService.(*userServiceImpl)
		targetService = projectService.TargetService.(*targetServiceImpl)

		ok, err := InitTestAdmin(userService)
		Expect(err).Should(BeNil())
		Expect(ok).Should(BeTrue())

		pp, err := projectService.ListProjects(context.TODO(), 0, 0)
		Expect(err).Should(BeNil())
		// reset all projects
		for _, p := range pp.Projects {
			_ = projectService.DeleteProject(context.TODO(), p.Name)
		}
		ctx := context.WithValue(context.TODO(), &apisv1.CtxKeyUser, FakeAdminName)
		envs, err := envService.ListEnvs(ctx, 0, 0, apisv1.ListEnvOptions{})
		Expect(err).Should(BeNil())
		// reset all projects
		for _, e := range envs.Envs {
			_ = envService.DeleteEnv(context.TODO(), e.Name)
		}
		targets, err := targetService.ListTargets(context.TODO(), 0, 0, "")
		Expect(err).Should(BeNil())
		// reset all projects
		for _, t := range targets.Targets {
			_ = targetService.DeleteTarget(context.TODO(), t.Name)
		}
	})

	It("Test Create project function", func() {
		req := apisv1.CreateProjectRequest{
			Name:        "test-project",
			Description: "this is a project description",
		}
		base, err := projectService.CreateProject(context.TODO(), req)
		Expect(err).Should(BeNil())
		Expect(cmp.Diff(base.Description, req.Description)).Should(BeEmpty())
		_, err = projectService.ListProjects(context.TODO(), 0, 0)
		Expect(err).Should(BeNil())
		err = projectService.DeleteProject(context.TODO(), "test-project")
		Expect(err).Should(BeNil())
	})

	It("Test Update project function", func() {
		req := apisv1.CreateProjectRequest{
			Name:        "test-project",
			Description: "this is a project description",
		}
		_, err := projectService.CreateProject(context.TODO(), req)
		Expect(err).Should(BeNil())

		base, err := projectService.UpdateProject(context.TODO(), "test-project", apisv1.UpdateProjectRequest{
			Alias:       "Change alias",
			Description: "Change description",
			Owner:       FakeAdminName,
		})
		Expect(err).Should(BeNil())
		Expect(base.Alias).Should(BeEquivalentTo("Change alias"))
		Expect(base.Description).Should(BeEquivalentTo("Change description"))
		Expect(base.Owner.Alias).Should(BeEquivalentTo("Administrator"))

		user := &model.User{
			Name:     "admin-2",
			Alias:    "Administrator2",
			Password: "ddddd",
			Disabled: false,
		}
		err = projectService.Store.Add(context.TODO(), user)
		Expect(err).Should(BeNil())
		base, err = projectService.UpdateProject(context.TODO(), "test-project", apisv1.UpdateProjectRequest{
			Alias:       "Change alias",
			Description: "Change description",
			Owner:       "admin-2",
		})
		Expect(err).Should(BeNil())
		Expect(base.Alias).Should(BeEquivalentTo("Change alias"))
		Expect(base.Description).Should(BeEquivalentTo("Change description"))
		Expect(base.Owner.Alias).Should(BeEquivalentTo("Administrator2"))
		res, err := projectService.ListProjectUser(context.TODO(), "test-project", 0, 0)
		Expect(err).Should(BeNil())
		Expect(res.Total).Should(Equal(int64(2)))

		_, err = projectService.UpdateProject(context.TODO(), "test-project", apisv1.UpdateProjectRequest{
			Alias:       "Change alias",
			Description: "Change description",
			Owner:       "admin-error",
		})
		Expect(err).Should(BeEquivalentTo(bcode.ErrProjectOwnerInvalid))
		err = projectService.DeleteProject(context.TODO(), "test-project")
		Expect(err).Should(BeNil())
	})

	It("Test Create project user function", func() {
		req := apisv1.CreateProjectRequest{
			Name:        "test-project",
			Description: "this is a project description",
		}
		_, err := projectService.CreateProject(context.TODO(), req)
		Expect(err).Should(BeNil())

		_, err = projectService.AddProjectUser(context.TODO(), "test-project", apisv1.AddProjectUserRequest{
			UserName:  FakeAdminName,
			UserRoles: []string{"project-admin"},
		})
		Expect(err).Should(BeNil())

		users, err := projectService.ListProjectUser(context.TODO(), "test-project", 0, 0)
		Expect(err).Should(BeNil())
		Expect(len(users.Users)).Should(Equal(1))
		Expect(users.Users[0].UserAlias).Should(Equal("Administrator"))
	})

	It("Test Update project user function", func() {
		req := apisv1.CreateProjectRequest{
			Name:        "test-project",
			Description: "this is a project description",
		}
		_, err := projectService.CreateProject(context.TODO(), req)
		Expect(err).Should(BeNil())

		_, err = projectService.AddProjectUser(context.TODO(), "test-project", apisv1.AddProjectUserRequest{
			UserName:  FakeAdminName,
			UserRoles: []string{"project-admin"},
		})
		Expect(err).Should(BeNil())

		_, err = projectService.UpdateProjectUser(context.TODO(), "test-project", FakeAdminName, apisv1.UpdateProjectUserRequest{
			UserRoles: []string{"project-admin", "app-developer"},
		})
		Expect(err).Should(BeNil())

		_, err = projectService.UpdateProjectUser(context.TODO(), "test-project", FakeAdminName, apisv1.UpdateProjectUserRequest{
			UserRoles: []string{"project-admin", "app-developer", "xxx"},
		})
		Expect(err).Should(BeEquivalentTo(bcode.ErrProjectRoleCheckFailure))
	})

	It("Test delete project user and delete project function", func() {
		req := apisv1.CreateProjectRequest{
			Name:        "test-project",
			Description: "this is a project description",
		}
		_, err := projectService.CreateProject(context.TODO(), req)
		Expect(err).Should(BeNil())

		_, err = projectService.AddProjectUser(context.TODO(), "test-project", apisv1.AddProjectUserRequest{
			UserName:  FakeAdminName,
			UserRoles: []string{"project-admin"},
		})
		Expect(err).Should(BeNil())

		err = projectService.DeleteProjectUser(context.TODO(), "test-project", FakeAdminName)
		Expect(err).Should(BeNil())
		err = projectService.DeleteProject(context.TODO(), "test-project")
		Expect(err).Should(BeNil())
		perms, err := projectService.RbacService.ListPermissions(context.TODO(), "test-project")
		Expect(err).Should(BeNil())
		Expect(len(perms)).Should(BeEquivalentTo(0))
		roles, err := projectService.RbacService.ListRole(context.TODO(), "test-project", 0, 0)
		Expect(err).Should(BeNil())
		Expect(roles.Total).Should(BeEquivalentTo(0))
	})
})
