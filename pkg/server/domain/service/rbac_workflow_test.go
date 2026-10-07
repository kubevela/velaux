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
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
)

func TestMigrateFeaturePermissions(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	for _, e := range []datastore.Entity{
		&model.Project{Name: "shop"},
		&model.Permission{Name: "project-view", Project: "shop", Resources: []string{"project:shop"}, Actions: []string{"detail", "list"}},
		&model.Permission{Name: "app-management", Project: "shop", Resources: []string{"project:shop/application:*/*", "project:shop/workflow:*", "project:shop/definition:*"}, Actions: []string{"*"}},
		&model.Permission{Name: "custom", Project: "shop", Resources: []string{"project:shop/workflow:*"}, Actions: []string{"*"}},
		&model.Permission{Name: "admin", Resources: []string{"*"}, Actions: []string{"*"}},
		&model.Role{Name: "app-developer", Project: "shop", Permissions: []string{"project-view", "app-management"}},
		&model.Role{Name: "auditor", Project: "shop", Permissions: []string{"custom"}},
	} {
		require.NoError(t, store.Add(ctx, e))
	}
	p := &rbacServiceImpl{Store: store}
	require.NoError(t, p.migratePermissions(ctx))

	get := func(name, project string) *model.Permission {
		perm := &model.Permission{Name: name, Project: project}
		require.NoError(t, store.Get(ctx, perm))
		return perm
	}
	t.Run("project view narrows to the project, its members and roles", func(t *testing.T) {
		assert.ElementsMatch(t, []string{"project:shop", "project:shop/role:*", "project:shop/projectUser:*", "project:shop/permission:*"}, get("project-view", "shop").Resources)
	})
	t.Run("each feature has a view", func(t *testing.T) {
		assert.ElementsMatch(t, []string{"project:shop/application:*/*:*", "project:shop/query:*"}, get("app-view", "shop").Resources, "as project creation formats it")
		assert.Equal(t, []string{"detail", "list"}, get("app-view", "shop").Actions)
		assert.Equal(t, []string{"project:shop/report:*"}, get("report-view", "shop").Resources)
		for _, view := range featureViews {
			get(view, "shop")
		}
	})
	t.Run("a role holding project view keeps what it read, through the views", func(t *testing.T) {
		role := &model.Role{Name: "app-developer", Project: "shop"}
		require.NoError(t, store.Get(ctx, role))
		for _, view := range featureViews {
			assert.Contains(t, role.Permissions, view)
		}
		auditor := &model.Role{Name: "auditor", Project: "shop"}
		require.NoError(t, store.Get(ctx, auditor))
		assert.Equal(t, []string{"custom"}, auditor.Permissions, "a role without project view is left alone")
	})
	t.Run("app management keeps applications alone", func(t *testing.T) {
		assert.Equal(t, []string{"project:shop/application:*/*"}, get("app-management", "shop").Resources)
	})
	t.Run("workflow and definition management are created in the project", func(t *testing.T) {
		assert.Equal(t, []string{"project:shop/workflow:*"}, get("workflow-management", "shop").Resources)
		assert.Equal(t, []string{"project:shop/definition:*"}, get("definition-management", "shop").Resources)
	})
	t.Run("a permission of the admins' own is left alone", func(t *testing.T) {
		assert.Equal(t, []string{"project:shop/workflow:*"}, get("custom", "shop").Resources)
	})
	t.Run("the platform gains the templates it lacks", func(t *testing.T) {
		assert.Equal(t, []string{"package:*"}, get("package-view", "").Resources)
		assert.Equal(t, []string{"defkit:*"}, get("defkit-management", "").Resources)
		assert.Equal(t, []string{"sharedWorkflow:*"}, get("global-workflow-management", "").Resources)
		assert.Equal(t, []string{"defkit:*"}, get("defkit-view", "").Resources)
		assert.Equal(t, []string{"detail", "list"}, get("cluster-view", "").Actions)
		assert.Equal(t, []string{"*"}, get("admin", "").Resources)
	})
	t.Run("it runs once: an admin's change afterwards stands", func(t *testing.T) {
		perm := get("app-management", "shop")
		perm.Resources = append(perm.Resources, "project:shop/workflow:*")
		require.NoError(t, store.Put(ctx, perm))
		require.NoError(t, p.migratePermissions(ctx))
		assert.Contains(t, get("app-management", "shop").Resources, "project:shop/workflow:*")
	})
}

func TestProjectWorkflowPermission(t *testing.T) {
	perms := func(resources, actions []string) []*model.Permission {
		return []*model.Permission{{Resources: resources, Actions: actions, Effect: "Allow"}}
	}
	check := func(resource, action string, granted []*model.Permission) bool {
		ra := &RequestResourceAction{}
		ra.SetResourceWithName(resource, func(string) string { return "" })
		ra.SetActions([]string{action})
		return ra.Match(granted)
	}
	view := perms([]string{"project:shop/workflow:*"}, []string{"detail", "list"})
	assert.True(t, check("project:shop/workflow:release", "detail", view))
	assert.False(t, check("project:shop/workflow:release", "update", view))
	assert.False(t, check("project:other/workflow:release", "detail", view))
	assert.False(t, check("sharedWorkflow:release", "update", perms([]string{"project:shop/workflow:*"}, []string{"*"})),
		"a project's permission never reaches global shared workflows")
	assert.True(t, check("sharedWorkflow:release", "update", perms([]string{"*"}, []string{"*"})))
}
