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
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/emicklei/go-restful/v3"
	"github.com/julienschmidt/httprouter"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/stretchr/testify/assert"

	"github.com/kubevela/velaux/pkg/plugin/router"
	"github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

var _ = Describe("Test rbac service", func() {
	BeforeEach(func() {
		InitTestEnv("rbac-test-kubevela")
		ctx = context.Background()
		ok, err := InitTestAdmin(userService)
		Expect(err).Should(BeNil())
		Expect(ok).Should(BeTrue())
		Expect(rbacService.Init(ctx)).Should(BeNil())
	})
	It("Test check resource", func() {
		path, err := checkResourcePath("project")
		Expect(err).Should(BeNil())
		Expect(path).Should(BeEquivalentTo("project:{projectName}"))

		path, err = checkResourcePath("application")
		Expect(err).Should(BeNil())
		Expect(path).Should(BeEquivalentTo("project:{projectName}/application:{appName}"))

		path, err = checkResourcePath("environment")
		Expect(err).Should(BeNil())
		Expect(path).Should(BeEquivalentTo("project:{projectName}/environment:{envName}"))

		_, err = checkResourcePath("applications")
		Expect(err).ShouldNot(BeNil())

		_, err = checkResourcePath("project/component")
		Expect(err).ShouldNot(BeNil())

		_, err = checkResourcePath("workflow")
		Expect(err).ShouldNot(BeNil())

		path, err = checkResourcePath("project/application/workflow")
		Expect(err).Should(BeNil())
		Expect(path).Should(BeEquivalentTo("project:{projectName}/application:{appName}/workflow:{workflowName}"))

		path, err = checkResourcePath("project/workflow")
		Expect(err).Should(BeNil())
		Expect(path).Should(BeEquivalentTo("project:{projectName}/workflow:{workflowName}"))

		path, err = checkResourcePath("component")
		Expect(err).Should(BeNil())
		Expect(path).Should(BeEquivalentTo("project:{projectName}/application:{appName}/component:{compName}"))

		path, err = checkResourcePath("role")
		Expect(err).Should(BeNil())
		Expect(path).Should(BeEquivalentTo("role:*"))

	})

	It("Test resource action", func() {
		ra := &RequestResourceAction{}
		ra.SetResourceWithName("project:{projectName}/workflow:{empty}", testPathParameter)
		Expect(ra.GetResource()).ShouldNot(BeNil())
		Expect(ra.GetResource().Value).Should(BeEquivalentTo("projectName"))
		Expect(ra.GetResource().Next).ShouldNot(BeNil())
		Expect(ra.GetResource().Next.Value).Should(BeEquivalentTo("*"))
		Expect(ra.GetResource().String()).Should(BeEquivalentTo("project:projectName/workflow:*"))
	})

	It("Test init and list platform permissions", func() {
		rbacService := rbacServiceImpl{Store: ds, KubeClient: k8sClient}
		err := rbacService.Init(context.TODO())
		Expect(err).Should(BeNil())
		policies, err := rbacService.ListPermissions(context.TODO(), "")
		Expect(err).Should(BeNil())
		Expect(len(policies)).Should(BeEquivalentTo(int64(10)))
	})

	It("Test checkPerm by admin user", func() {
		rbac := rbacServiceImpl{Store: ds}
		req := &http.Request{
			URL: &url.URL{},
		}
		req = req.WithContext(context.WithValue(req.Context(), &apisv1.CtxKeyUser, FakeAdminName))
		res := &restful.Response{}
		pass := false
		filter := &restful.FilterChain{
			Target: restful.RouteFunction(func(_ *restful.Request, _ *restful.Response) {
				pass = true
			}),
		}
		rbac.CheckPerm("cluster", "create")(restful.NewRequest(req), res, filter)
		Expect(pass).Should(BeTrue())
		pass = false
		rbac.CheckPerm("role", "list")(restful.NewRequest(req), res, filter)
		Expect(pass).Should(BeTrue())
	})

	It("Test checkPerm by dev user", func() {
		var projectName = "test-app-project"

		err := ds.Add(context.TODO(), &model.User{Name: "dev"})
		Expect(err).Should(BeNil())

		err = ds.Add(context.TODO(), &model.Project{Name: projectName})
		Expect(err).Should(BeNil())

		err = ds.Add(context.TODO(), &model.ProjectUser{Username: "dev", ProjectName: projectName, UserRoles: []string{"application-admin"}})
		Expect(err).Should(BeNil())

		err = ds.Add(context.TODO(), &model.Role{Project: projectName, Name: "application-admin", Permissions: []string{"application-manage"}})
		Expect(err).Should(BeNil())

		err = ds.Add(context.TODO(), &model.Permission{Project: projectName, Name: "application-manage", Resources: []string{"project:test-app-project/application:*"}, Actions: []string{"*"}})
		Expect(err).Should(BeNil())

		rbac := rbacServiceImpl{Store: ds}
		header := http.Header{}
		header.Set("Accept", "application/json")
		header.Set("Content-Type", "application/json")
		req := &http.Request{
			Header: header,
			URL:    &url.URL{},
		}
		req = req.WithContext(context.WithValue(req.Context(), &apisv1.CtxKeyUser, "dev"))
		req.Form = url.Values{}
		req.Form.Set("project", projectName)

		record := httptest.NewRecorder()
		res := restful.NewResponse(record)
		res.SetRequestAccepts("application/json")
		pass := false
		filter := &restful.FilterChain{
			Target: restful.RouteFunction(func(req *restful.Request, res *restful.Response) {
				pass = true
			}),
		}
		rbac.CheckPerm("cluster", "create")(restful.NewRequest(req), res, filter)
		Expect(pass).Should(BeFalse())
		Expect(res.StatusCode()).Should(Equal(int(bcode.ErrForbidden.HTTPCode)))

		rbac.CheckPerm("component", "list")(restful.NewRequest(req), res, filter)
		Expect(res.StatusCode()).Should(Equal(int(bcode.ErrForbidden.HTTPCode)))
	})

	It("Test initDefaultRoleAndUsersForProject", func() {
		rbacService := rbacServiceImpl{Store: ds}
		err := ds.Add(context.TODO(), &model.User{Name: "test-user"})
		Expect(err).Should(BeNil())

		err = ds.Add(context.TODO(), &model.Project{Name: "init-test", Owner: "test-user"})
		Expect(err).Should(BeNil())
		err = rbacService.SyncDefaultRoleAndUsersForProject(context.TODO(), &model.Project{Name: "init-test"})
		Expect(err).Should(BeNil())

		roles, err := rbacService.ListRole(context.TODO(), "init-test", 0, 0)
		Expect(err).Should(BeNil())
		Expect(roles.Total).Should(BeEquivalentTo(int64(3)))

		policies, err := rbacService.ListPermissions(context.TODO(), "init-test")
		Expect(err).Should(BeNil())
		Expect(len(policies)).Should(BeEquivalentTo(int64(6)))
	})

	It("Test UpdatePermission", func() {
		rbacService := rbacServiceImpl{Store: ds}
		base, err := rbacService.UpdatePermission(context.TODO(), "test-app-project", "application-manage", &apisv1.UpdatePermissionRequest{
			Resources: []string{"project:{projectName}/application:*/*"},
			Actions:   []string{"*"},
			Alias:     "App Management Update",
		})
		Expect(err).Should(BeNil())
		Expect(base.Alias).Should(BeEquivalentTo("App Management Update"))
	})
	It("TestCheckPluginRequestPerm", func() {
		defer GinkgoRecover()

		// Add the test user
		err := ds.Add(context.TODO(), &model.Permission{Name: "test", Resources: []string{"plugin:p1/cluster:local/node"}, Actions: []string{"*"}})
		Expect(err).Should(BeNil())
		err = ds.Add(context.TODO(), &model.Role{Name: "test", Permissions: []string{"test"}})
		Expect(err).Should(BeNil())
		err = ds.Add(context.TODO(), &model.User{Name: "test", UserRoles: []string{"test"}})
		Expect(err).Should(BeNil())

		// Add the test2 user that not have the permission
		err = ds.Add(context.TODO(), &model.Permission{Name: "test2", Resources: []string{"plugin:p2/*"}, Actions: []string{"*"}})
		Expect(err).Should(BeNil())
		err = ds.Add(context.TODO(), &model.Role{Name: "test2", Permissions: []string{"test2"}})
		Expect(err).Should(BeNil())
		err = ds.Add(context.TODO(), &model.User{Name: "test2", UserRoles: []string{"test2"}})
		Expect(err).Should(BeNil())

		rbacService := rbacServiceImpl{Store: ds}
		checker := rbacService.CheckPluginRequestPerm(httprouter.Params{
			{
				Key:   "clusterName",
				Value: "local",
			},
			{
				Key:   "nodeName",
				Value: "n1",
			},
			{
				Key:   router.DefaultPluginResourceKey,
				Value: "p1",
			},
		}, &types.Route{
			Path: "/api/v1/clusters/:clusterName/nodes/:node",
			ResourceMap: map[string]string{
				"cluster": "clusterName",
				"node":    "nodeName",
			},
			Permission: &types.Permission{
				Resource: "cluster/node",
				Action:   "detail",
			},
		})
		Expect(ResourceMaps["plugin"].subResources["cluster"].subResources["node"].pathName).Should(Equal("nodeName"))
		var res = &httptest.ResponseRecorder{}
		var req = &http.Request{Method: "GET", URL: &url.URL{Scheme: "http", Path: "/proxy/plugins/p1/api/v1/clusters/local/nodes/n1", Host: "127.0.0.1"}}
		req = req.WithContext(context.WithValue(context.TODO(), &apisv1.CtxKeyUser, FakeAdminName))
		Expect(checker(req, res)).Should(Equal(true))

		req = req.WithContext(context.WithValue(context.TODO(), &apisv1.CtxKeyUser, "test"))
		Expect(checker(req, res)).Should(Equal(true))

		req = req.WithContext(context.WithValue(context.TODO(), &apisv1.CtxKeyUser, "test2"))
		Expect(checker(req, res)).Should(Equal(false))

		checker = rbacService.CheckPluginRequestPerm(httprouter.Params{
			{
				Key:   "clusterName",
				Value: "local",
			},
			{
				Key:   "pvName",
				Value: "p1",
			},
			{
				Key:   router.DefaultPluginResourceKey,
				Value: "p2",
			},
		}, &types.Route{
			Path: "/api/v1/clusters/:clusterName/pv/:pvName",
			ResourceMap: map[string]string{
				"cluster": "clusterName",
				"pv":      "pvName",
			},
			Permission: &types.Permission{
				Resource: "cluster/pv",
				Action:   "detail",
			},
		})
		res = &httptest.ResponseRecorder{}
		req = &http.Request{Method: "GET", URL: &url.URL{Scheme: "http", Path: "/proxy/plugins/p1/api/v1/clusters/local/pv/p1", Host: "127.0.0.1"}}
		req = req.WithContext(context.WithValue(context.TODO(), &apisv1.CtxKeyUser, "test2"))
		Expect(checker(req, res)).Should(Equal(true))
	})

})

var _ = Describe("MergeMap", func() {
	defer GinkgoRecover()
	Context("when the source map is empty", func() {
		It("should not modify the target map", func() {
			source := make(map[string]resourceMetadata)
			target := map[string]resourceMetadata{
				"node": {pathName: "nodeName"},
			}
			mergeMap(source, target)
			Expect(target).To(HaveLen(1))
			Expect(target["node"].pathName).To(Equal("nodeName"))
		})
	})

	Context("when the target map is empty", func() {
		It("should modify target just like source", func() {
			source := map[string]resourceMetadata{
				"node": {pathName: "nodeName"},
			}
			target := make(map[string]resourceMetadata)
			mergeMap(source, target)
			Expect(target).To(HaveLen(1))
			Expect(target["node"].pathName).To(Equal("nodeName"))
		})
	})

	Context("when the both are not empty", func() {
		When("have no conflict", func() {
			source := map[string]resourceMetadata{
				"node": {pathName: "nodeName"},
			}
			target := map[string]resourceMetadata{
				"cluster": {pathName: "clusterName"},
			}
			mergeMap(source, target)
			Expect(target).To(HaveLen(2))
			Expect(target["node"].pathName).To(Equal("nodeName"))
			Expect(target["cluster"].pathName).To(Equal("clusterName"))
		})

		When("have nested field", func() {
			source := map[string]resourceMetadata{
				"node": {pathName: "nodeName"},
			}
			target := map[string]resourceMetadata{
				"cluster": {subResources: map[string]resourceMetadata{
					"node": {pathName: "nodeName"},
				}},
			}
			mergeMap(source, target)
			Expect(target).To(HaveLen(2))
			Expect(target["cluster"].subResources).To(HaveLen(1))
			Expect(target["cluster"].subResources["node"].pathName).To(Equal("nodeName"))
			Expect(target["node"].pathName).To(Equal("nodeName"))
		})

		When("merge nested field and subResource is nil and pathName is empty", func() {
			source := map[string]resourceMetadata{
				"plugin": {pathName: "pluginName", subResources: map[string]resourceMetadata{
					"cluster": {pathName: "clusterName", subResources: map[string]resourceMetadata{
						"node": {pathName: "nodeName"},
					},
					},
				},
				},
			}
			target := map[string]resourceMetadata{
				"plugin": {subResources: nil, pathName: ""},
			}
			mergeMap(source, target)
			Expect(target).To(HaveLen(1))
			Expect(target["plugin"].subResources).To(HaveLen(1))
			Expect(target["plugin"].subResources["cluster"].subResources).To(HaveLen(1))
			Expect(target["plugin"].subResources["cluster"].subResources["node"].pathName).To(Equal("nodeName"))
		})
	})

})

func testPathParameter(name string) string {
	if name == "empty" {
		return ""
	}
	return name
}
func TestRequestResourceAction(t *testing.T) {
	ra := &RequestResourceAction{}
	ra.SetResourceWithName("project:{projectName}/workflow:{empty}", testPathParameter)
	assert.NotEqual(t, ra.GetResource(), nil)
	assert.Equal(t, ra.GetResource().Value, "projectName")
	assert.NotEqual(t, ra.GetResource().Next, nil)
	assert.Equal(t, ra.GetResource().Next.Value, "*")

	ra2 := &RequestResourceAction{}
	ra2.SetResourceWithName("project:{empty}/application:{empty}", testPathParameter)
	assert.Equal(t, ra2.GetResource().String(), "project:*/application:*")
}

func TestRequestResourceActionMatch(t *testing.T) {
	ra := &RequestResourceAction{}
	ra.SetResourceWithName("project:{projectName}/workflow:{empty}", testPathParameter)
	ra.SetActions([]string{"create"})
	assert.Equal(t, ra.Match([]*model.Permission{{Resources: []string{"project:*/workflow:*"}, Actions: []string{"*"}}}), true)
	assert.Equal(t, ra.Match([]*model.Permission{{Resources: []string{"project:ddd/workflow:*"}, Actions: []string{"create"}}}), false)
	assert.Equal(t, ra.Match([]*model.Permission{{Resources: []string{"project:projectName/workflow:*"}, Actions: []string{"create"}}}), true)
	assert.Equal(t, ra.Match([]*model.Permission{{Resources: []string{"project:projectName/workflow:*"}, Actions: []string{"create"}, Effect: "Deny"}}), false)

	ra2 := &RequestResourceAction{}
	ra2.SetResourceWithName("project:{projectName}/application:{app1}/component:{empty}", testPathParameter)
	ra2.SetActions([]string{"delete"})
	assert.Equal(t, ra2.Match([]*model.Permission{{Resources: []string{"project:*/application:app1/component:*"}, Actions: []string{"*"}}}), true)
	assert.Equal(t, ra2.Match([]*model.Permission{{Resources: []string{"project:*/application:app1/component:*"}, Actions: []string{"list", "delete"}}}), true)
	assert.Equal(t, ra2.Match([]*model.Permission{{Resources: []string{"project:*", "project:*/application:app1/component:*"}, Actions: []string{"list", "delete"}}}), true)
	assert.Equal(t, ra2.Match([]*model.Permission{{Resources: []string{"project:*/application:app1/component:*"}, Actions: []string{"list", "detail"}}}), false)
	assert.Equal(t, ra2.Match([]*model.Permission{{Resources: []string{"*"}, Actions: []string{"*"}}}), true)
	assert.Equal(t, ra2.Match([]*model.Permission{{Resources: []string{"*"}, Actions: []string{"*"}}, {Actions: []string{"*"}, Resources: []string{"project:*/application:app1/component:*"}, Effect: "Deny"}}), false)
	assert.Equal(t, ra2.Match([]*model.Permission{{Resources: []string{"project:projectName/application:*/*"}, Actions: []string{"*"}}}), true)

	ra3 := &RequestResourceAction{}
	ra3.SetResourceWithName("project:test-123", testPathParameter)
	ra3.SetActions([]string{"detail"})
	assert.Equal(t, ra3.Match([]*model.Permission{{Resources: []string{"*"}, Actions: []string{"*"}, Effect: "Allow"}}), true)

	ra4 := &RequestResourceAction{}
	ra4.SetResourceWithName("role:*", testPathParameter)
	ra4.SetActions([]string{"list"})
	assert.Equal(t, ra4.Match([]*model.Permission{{Resources: []string{"*"}, Actions: []string{"*"}, Effect: "Allow"}}), true)

	ra5 := &RequestResourceAction{}
	ra5.SetResourceWithName("project:*/application:*", testPathParameter)
	ra5.SetActions([]string{"list"})
	assert.Equal(t, ra5.Match([]*model.Permission{{Resources: []string{"project:*/application:*"}, Actions: []string{"list"}, Effect: "Allow"}}), true)

	ra6 := &RequestResourceAction{}
	path, err := checkResourcePath("environment")
	assert.Equal(t, err, nil)
	ra6.SetResourceWithName(path, func(name string) string {
		if name == "projectName" {
			return "default"
		}
		return ""
	})
	ra6.SetActions([]string{"create"})
	assert.Equal(t, ra6.Match([]*model.Permission{{Resources: []string{
		"project:*/*", "addon:* addonRegistry:*", "target:*", "cluster:*/namespace:*", "user:*", "role:*", "permission:*", "configType:*/*", "project:*",
		"project:default/config:*", "project:default/role:*", "project:default/projectUser:*", "project:default/permission:*", "project:default/environment:*", "project:default/application:*/*", "project:default",
	}, Actions: []string{"list", "detail"}, Effect: "Allow"}}), false)

}

func TestRegisterResourceAction(t *testing.T) {
	registerResourceAction("role", "list")
	registerResourceAction("project/role", "list")
	t.Log(resourceActions)
}

func TestRegisterPluginResource(t *testing.T) {
	RegisterPluginResource("cluster/node", map[string]string{
		"cluster": "clusterName",
		"node":    "nodeName",
	})
	_, err := checkResourcePath("plugin/cluster/node")
	assert.Equal(t, err, nil)
	RegisterPluginResource("cluster/pv", map[string]string{
		"cluster": "clusterName",
		"pv":      "pvName",
	})
	_, err = checkResourcePath("plugin/cluster/pv")
	assert.Equal(t, err, nil)
}
