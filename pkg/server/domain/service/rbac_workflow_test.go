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

func TestAddProjectPermissionResources(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	store, err := kubeapi.New(ctx, datastore.Config{Database: "kubevela"}, cli)
	require.NoError(t, err)
	for _, e := range []datastore.Entity{
		&model.Permission{Name: "project-view", Project: "shop", Resources: []string{"project:shop"}, Actions: []string{"detail", "list"}},
		&model.Permission{Name: "app-management", Project: "shop", Resources: []string{"project:shop/application:*/*", "project:shop/workflow:*"}, Actions: []string{"*"}},
		&model.Permission{Name: "custom", Project: "shop", Resources: []string{"project:shop/config:*"}, Actions: []string{"*"}},
		&model.Permission{Name: "admin", Resources: []string{"*"}, Actions: []string{"*"}},
	} {
		require.NoError(t, store.Add(ctx, e))
	}
	p := &rbacServiceImpl{Store: store}
	require.NoError(t, p.addProjectPermissionResources(ctx))
	require.NoError(t, p.addProjectPermissionResources(ctx), "a second start changes nothing")

	get := func(name, project string) []string {
		perm := &model.Permission{Name: name, Project: project}
		require.NoError(t, store.Get(ctx, perm))
		return perm.Resources
	}
	assert.Equal(t, []string{"project:shop", "project:shop/workflow:*", "project:shop/definition:*"}, get("project-view", "shop"))
	assert.Equal(t, []string{"project:shop/application:*/*", "project:shop/workflow:*", "project:shop/definition:*"}, get("app-management", "shop"), "not added twice")
	assert.Equal(t, []string{"project:shop/config:*"}, get("custom", "shop"), "a permission of its own is left alone")
	assert.Equal(t, []string{"*"}, get("admin", ""))
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
