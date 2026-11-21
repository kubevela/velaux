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
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/emicklei/go-restful/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// preSplitStore is project shop as main left it between #972 and #973: App
// Management writing applications, workflows and definitions, held by the
// built-in roles and a custom release-manager; a read-only auditor; and project
// other, for roles a case adds.
func preSplitStore(t *testing.T, extra ...datastore.Entity) datastore.DataStore {
	t.Helper()
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	appManagement := func(project string) *model.Permission {
		return &model.Permission{Name: "app-management", Project: project, Actions: []string{"*"},
			Resources: []string{"project:" + project + "/application:*/*", "project:" + project + "/workflow:*", "project:" + project + "/definition:*"}}
	}
	entities := []datastore.Entity{
		&model.Project{Name: "shop"},
		&model.Project{Name: "other"},
		&model.Permission{Name: "project-view", Project: "shop", Resources: []string{"project:shop"}, Actions: []string{"detail", "list"}},
		appManagement("shop"),
		appManagement("other"),
		&model.Role{Name: "project-admin", Project: "shop", Permissions: []string{"project-view", "app-management"}},
		&model.Role{Name: "app-developer", Project: "shop", Permissions: []string{"project-view", "app-management"}},
		&model.Role{Name: "release-manager", Project: "shop", Permissions: []string{"app-management"}},
		&model.Role{Name: "auditor", Project: "shop", Permissions: []string{"project-view"}},
	}
	for _, e := range append(entities, extra...) {
		require.NoError(t, store.Add(ctx, e))
	}
	return store
}

func rolePermissions(t *testing.T, store datastore.DataStore, project, name string) []string {
	t.Helper()
	role := &model.Role{Name: name, Project: project}
	require.NoError(t, store.Get(context.Background(), role))
	return role.Permissions
}

func TestUpgradeGivesBuiltinRolesTheirManagement(t *testing.T) {
	ctx := context.Background()

	t.Run("upgrading: Project Admin and App Developer hold what a new project gives them", func(t *testing.T) {
		store := preSplitStore(t)
		require.NoError(t, (&rbacServiceImpl{Store: store}).migratePermissions(ctx))
		for _, role := range []string{"project-admin", "app-developer"} {
			perms := rolePermissions(t, store, "shop", role)
			assert.Contains(t, perms, "workflow-management", role)
			assert.Contains(t, perms, "definition-management", role)
		}
	})

	t.Run("from v1.9.5, where App Management wrote applications alone, the same", func(t *testing.T) {
		ctx := context.Background()
		cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
		store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
		require.NoError(t, err)
		for _, e := range []datastore.Entity{
			&model.Project{Name: "shop"},
			&model.Permission{Name: "project-view", Project: "shop", Resources: []string{"project:shop"}, Actions: []string{"detail", "list"}},
			&model.Permission{Name: "app-management", Project: "shop", Resources: []string{"project:shop/application:*/*"}, Actions: []string{"*"}},
			&model.Role{Name: "app-developer", Project: "shop", Permissions: []string{"project-view", "app-management"}},
			&model.Role{Name: "release-manager", Project: "shop", Permissions: []string{"app-management"}},
		} {
			require.NoError(t, store.Add(ctx, e))
		}
		require.NoError(t, (&rbacServiceImpl{Store: store}).migratePermissions(ctx))
		assert.Contains(t, rolePermissions(t, store, "shop", "app-developer"), "workflow-management")
		assert.Contains(t, rolePermissions(t, store, "shop", "app-developer"), "definition-management")
		assert.NotContains(t, rolePermissions(t, store, "shop", "release-manager"), "workflow-management",
			"a custom role scoped to applications is not widened onto shared workflows")
	})

	t.Run("a project without the Management templates gives its built-in roles neither", func(t *testing.T) {
		ctx := context.Background()
		cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
		store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
		require.NoError(t, err)
		for _, e := range []datastore.Entity{
			&model.Project{Name: "bare"},
			&model.Role{Name: "project-admin", Project: "bare", Permissions: []string{"project-view"}},
		} {
			require.NoError(t, store.Add(ctx, e))
		}
		require.NoError(t, migrateFeatureManagementGrants(ctx, &rbacServiceImpl{Store: store}))
		perms := rolePermissions(t, store, "bare", "project-admin")
		assert.NotContains(t, perms, "workflow-management", "no role names a permission its project lacks")
		assert.NotContains(t, perms, "definition-management")
	})

	t.Run("a custom role, App Management or not, gains neither", func(t *testing.T) {
		store := preSplitStore(t)
		require.NoError(t, (&rbacServiceImpl{Store: store}).migratePermissions(ctx))
		for _, role := range []string{"release-manager", "auditor"} {
			perms := rolePermissions(t, store, "shop", role)
			assert.NotContains(t, perms, "workflow-management", role)
			assert.NotContains(t, perms, "definition-management", role)
		}
	})

	t.Run("an install where the split already ran is put right", func(t *testing.T) {
		store := preSplitStore(t)
		p := &rbacServiceImpl{Store: store}
		require.NoError(t, migrateFeaturePermissions(ctx, p))
		require.NoError(t, store.Add(ctx, &model.Migration{Name: "2026-10-05-feature-permissions"}))
		require.NoError(t, migrateFeatureViews(ctx, p))
		require.NoError(t, store.Add(ctx, &model.Migration{Name: "2026-10-05-feature-views"}))
		assert.NotContains(t, rolePermissions(t, store, "shop", "app-developer"), "workflow-management", "the bug: the split left the writes with no role")

		require.NoError(t, p.migratePermissions(ctx))
		assert.Contains(t, rolePermissions(t, store, "shop", "app-developer"), "workflow-management")
		assert.Contains(t, rolePermissions(t, store, "shop", "app-developer"), "definition-management")
	})

	t.Run("only what a role lacks is added, once", func(t *testing.T) {
		store := preSplitStore(t, &model.Role{Name: "project-admin", Project: "other", Permissions: []string{"app-management", "workflow-management"}})
		p := &rbacServiceImpl{Store: store}
		require.NoError(t, p.migratePermissions(ctx))
		require.NoError(t, p.migratePermissions(ctx))
		perms := rolePermissions(t, store, "other", "project-admin")
		count := 0
		for _, perm := range perms {
			if perm == "workflow-management" {
				count++
			}
		}
		assert.Equal(t, 1, count)
		assert.Contains(t, perms, "definition-management")
	})
}

func TestProjectViewerComparesApplications(t *testing.T) {
	ctx := context.Background()
	newStore := func(t *testing.T, entities ...datastore.Entity) datastore.DataStore {
		t.Helper()
		cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
		store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
		require.NoError(t, err)
		base := []datastore.Entity{
			&model.User{Name: "viewer"},
			&model.Project{Name: "shop"},
			&model.ProjectUser{ProjectName: "shop", Username: "viewer", UserRoles: []string{"project-viewer"}},
		}
		for _, e := range append(base, entities...) {
			require.NoError(t, store.Add(ctx, e))
		}
		return store
	}
	allowed := func(t *testing.T, store datastore.DataStore, action string) bool {
		t.Helper()
		req := &http.Request{Header: http.Header{}, URL: &url.URL{}, Form: url.Values{"project": {"shop"}}}
		req = req.WithContext(context.WithValue(ctx, &apisv1.CtxKeyUser, "viewer"))
		res := restful.NewResponse(httptest.NewRecorder())
		res.SetRequestAccepts("application/json")
		pass := false
		chain := &restful.FilterChain{Target: func(*restful.Request, *restful.Response) { pass = true }}
		(&rbacServiceImpl{Store: store}).CheckPerm("application", action)(restful.NewRequest(req), res, chain)
		return pass
	}
	actions := func(t *testing.T, store datastore.DataStore, name string) []string {
		t.Helper()
		perm := &model.Permission{Name: name, Project: "shop"}
		require.NoError(t, store.Get(ctx, perm))
		return perm.Actions
	}

	t.Run("in a project created now", func(t *testing.T) {
		store := newStore(t)
		require.NoError(t, (&rbacServiceImpl{Store: store}).SyncDefaultRoleAndUsersForProject(ctx, &model.Project{Name: "shop"}))
		assert.True(t, allowed(t, store, "compare"))
		assert.False(t, allowed(t, store, "deploy"))
		assert.False(t, allowed(t, store, "update"))
	})

	t.Run("upgrading: App View gains compare", func(t *testing.T) {
		store := newStore(t,
			&model.Permission{Name: "app-view", Project: "shop", Resources: []string{"project:shop/application:*/*:*", "project:shop/query:*"}, Actions: []string{"detail", "list"}},
			&model.Permission{Name: "env-view", Project: "shop", Resources: []string{"project:shop/environment:*"}, Actions: []string{"detail", "list"}},
			&model.Role{Name: "project-viewer", Project: "shop", Permissions: []string{"project-view", "app-view", "env-view"}},
			&model.Migration{Name: "2026-10-05-feature-permissions"},
			&model.Migration{Name: "2026-10-05-feature-views"},
			&model.Migration{Name: "2026-10-19-feature-management-grants"},
		)
		assert.False(t, allowed(t, store, "compare"), "before the upgrade")
		require.NoError(t, (&rbacServiceImpl{Store: store}).migratePermissions(ctx))
		assert.True(t, allowed(t, store, "compare"))
		assert.False(t, allowed(t, store, "deploy"))
		assert.Equal(t, []string{"detail", "list", "compare"}, actions(t, store, "app-view"))
		assert.Equal(t, []string{"detail", "list"}, actions(t, store, "env-view"))
	})

	t.Run("an App View an admin widened to everything is left alone", func(t *testing.T) {
		store := newStore(t,
			&model.Permission{Name: "app-view", Project: "shop", Resources: []string{"project:shop/application:*/*:*"}, Actions: []string{"*"}},
		)
		require.NoError(t, (&rbacServiceImpl{Store: store}).migratePermissions(ctx))
		assert.Equal(t, []string{"*"}, actions(t, store, "app-view"))
	})
}
