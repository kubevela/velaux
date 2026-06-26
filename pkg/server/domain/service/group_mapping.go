/*
Copyright 2024 The KubeVela Authors.

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

	corev1 "k8s.io/api/core/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/yaml"

	velatypes "github.com/oam-dev/kubevela/apis/types"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

const (
	// GroupMappingConfigMapName is the name of the ConfigMap that stores group-to-project/role mappings
	GroupMappingConfigMapName = "velaux-rbac-cm"
	// GroupMappingConfigMapKey is the data key within the ConfigMap
	GroupMappingConfigMapKey = "groups"
)

// GroupMappingService manages OIDC group-to-project/role mappings via a Kubernetes ConfigMap.
type GroupMappingService interface {
	// GetGroupMappings retrieves the current group mapping configuration from the ConfigMap.
	GetGroupMappings(ctx context.Context) (*apisv1.GroupMappingResponse, error)
	// UpdateGroupMappings writes the group mapping configuration to the ConfigMap.
	UpdateGroupMappings(ctx context.Context, req apisv1.UpdateGroupMappingRequest) (*apisv1.GroupMappingResponse, error)
	// SyncUserGroupMappings applies the group mappings for a user based on their OIDC groups.
	// It ensures the user has the correct ProjectUser records with the correct roles.
	SyncUserGroupMappings(ctx context.Context, userName string, oidcGroups []string) error
	// Init ensures the velaux-rbac-cm ConfigMap exists.
	Init(ctx context.Context) error
}

type groupMappingServiceImpl struct {
	Store      datastore.DataStore `inject:"datastore"`
	KubeClient client.Client       `inject:"kubeClient"`
}

// NewGroupMappingService creates a new GroupMappingService instance.
func NewGroupMappingService() GroupMappingService {
	return &groupMappingServiceImpl{}
}

func (g *groupMappingServiceImpl) Init(ctx context.Context) error {
	cm := &corev1.ConfigMap{}
	if err := g.KubeClient.Get(ctx, types.NamespacedName{
		Name:      GroupMappingConfigMapName,
		Namespace: velatypes.DefaultKubeVelaNS,
	}, cm); err != nil {
		if kerrors.IsNotFound(err) {
			// Create the ConfigMap with empty data
			cm = &corev1.ConfigMap{
				ObjectMeta: metav1.ObjectMeta{
					Name:      GroupMappingConfigMapName,
					Namespace: velatypes.DefaultKubeVelaNS,
				},
				Data: map[string]string{
					GroupMappingConfigMapKey: "{}",
				},
			}
			if err := g.KubeClient.Create(ctx, cm); err != nil {
				if !kerrors.IsAlreadyExists(err) {
					return err
				}
			}
			klog.Info("Created velaux-rbac-cm ConfigMap with empty group mappings")
			return nil
		}
		return err
	}
	klog.Info("velaux-rbac-cm ConfigMap already exists")
	return nil
}

func (g *groupMappingServiceImpl) GetGroupMappings(ctx context.Context) (*apisv1.GroupMappingResponse, error) {
	mapping, err := g.readConfigMap(ctx)
	if err != nil {
		return nil, err
	}
	return convertMappingToResponse(mapping), nil
}

func (g *groupMappingServiceImpl) UpdateGroupMappings(ctx context.Context, req apisv1.UpdateGroupMappingRequest) (*apisv1.GroupMappingResponse, error) {
	// Validate that all referenced projects and roles exist
	if err := g.validateMappings(ctx, req.Groups); err != nil {
		return nil, err
	}

	// Build the model
	mapping := &model.GroupRoleMapping{
		Groups: make(map[string][]model.GroupProjectRole),
	}
	for group, roles := range req.Groups {
		for _, r := range roles {
			mapping.Groups[group] = append(mapping.Groups[group], model.GroupProjectRole{
				Project: r.Project,
				Role:    r.Role,
			})
		}
	}

	// Marshal to YAML
	data, err := yaml.Marshal(mapping)
	if err != nil {
		return nil, bcode.ErrGroupMappingInvalidConfig
	}

	// Get or create the ConfigMap
	cm := &corev1.ConfigMap{}
	if err := g.KubeClient.Get(ctx, types.NamespacedName{
		Name:      GroupMappingConfigMapName,
		Namespace: velatypes.DefaultKubeVelaNS,
	}, cm); err != nil {
		if kerrors.IsNotFound(err) {
			cm = &corev1.ConfigMap{
				ObjectMeta: metav1.ObjectMeta{
					Name:      GroupMappingConfigMapName,
					Namespace: velatypes.DefaultKubeVelaNS,
				},
				Data: map[string]string{
					GroupMappingConfigMapKey: string(data),
				},
			}
			if err := g.KubeClient.Create(ctx, cm); err != nil {
				return nil, err
			}
			return convertMappingToResponse(mapping), nil
		}
		return nil, err
	}

	// Update existing ConfigMap
	if cm.Data == nil {
		cm.Data = make(map[string]string)
	}
	cm.Data[GroupMappingConfigMapKey] = string(data)
	if err := g.KubeClient.Update(ctx, cm); err != nil {
		return nil, err
	}

	return convertMappingToResponse(mapping), nil
}

func (g *groupMappingServiceImpl) SyncUserGroupMappings(ctx context.Context, userName string, oidcGroups []string) error {
	if len(oidcGroups) == 0 {
		return nil
	}

	mapping, err := g.readConfigMap(ctx)
	if err != nil {
		// If the ConfigMap doesn't exist, just skip silently
		if errors.Is(err, bcode.ErrGroupMappingConfigNotFound) {
			klog.V(4).Info("velaux-rbac-cm ConfigMap not found, skipping group mapping sync")
			return nil
		}
		return err
	}

	if len(mapping.Groups) == 0 {
		return nil
	}

	// Collect all project/role assignments from matching groups
	type projectRole struct {
		project string
		role    string
	}
	// Use a map to deduplicate
	assignmentSet := make(map[string]map[string]bool) // project -> set of roles
	for _, group := range oidcGroups {
		if roles, ok := mapping.Groups[group]; ok {
			for _, pr := range roles {
				if assignmentSet[pr.Project] == nil {
					assignmentSet[pr.Project] = make(map[string]bool)
				}
				assignmentSet[pr.Project][pr.Role] = true
			}
		}
	}

	if len(assignmentSet) == 0 {
		return nil
	}

	// For each project, create or update the ProjectUser record
	for projectName, roles := range assignmentSet {
		// Verify the project exists
		project := &model.Project{Name: projectName}
		if err := g.Store.Get(ctx, project); err != nil {
			if errors.Is(err, datastore.ErrRecordNotExist) {
				klog.Warningf("group mapping references non-existent project %q, skipping", projectName)
				continue
			}
			return err
		}

		// Build the list of roles
		var roleList []string
		for role := range roles {
			roleList = append(roleList, role)
		}

		// Try to get existing ProjectUser
		projectUser := &model.ProjectUser{
			Username:    userName,
			ProjectName: projectName,
		}
		if err := g.Store.Get(ctx, projectUser); err != nil {
			if errors.Is(err, datastore.ErrRecordNotExist) {
				// Create new ProjectUser
				projectUser.UserRoles = roleList
				if err := g.Store.Add(ctx, projectUser); err != nil {
					if errors.Is(err, datastore.ErrRecordExist) {
						// Race condition - try update instead
						projectUser.UserRoles = roleList
						if err := g.Store.Put(ctx, projectUser); err != nil {
							klog.Errorf("failed to update project user %s in project %s: %s", userName, projectName, err.Error())
							continue
						}
					} else {
						klog.Errorf("failed to create project user %s in project %s: %s", userName, projectName, err.Error())
						continue
					}
				}
				klog.Infof("created project user %s in project %s with roles %v via group mapping", userName, projectName, roleList)
			} else {
				return err
			}
		} else {
			// Update existing ProjectUser roles - merge group-managed roles with existing manual roles
			mergedRoles := mergeRoles(projectUser.UserRoles, roleList)
			if !rolesEqual(projectUser.UserRoles, mergedRoles) {
				projectUser.UserRoles = mergedRoles
				if err := g.Store.Put(ctx, projectUser); err != nil {
					klog.Errorf("failed to update project user %s in project %s: %s", userName, projectName, err.Error())
					continue
				}
				klog.Infof("updated project user %s in project %s with merged roles %v via group mapping", userName, projectName, mergedRoles)
			}
		}
	}

	return nil
}

// readConfigMap reads and parses the velaux-rbac-cm ConfigMap.
func (g *groupMappingServiceImpl) readConfigMap(ctx context.Context) (*model.GroupRoleMapping, error) {
	cm := &corev1.ConfigMap{}
	if err := g.KubeClient.Get(ctx, types.NamespacedName{
		Name:      GroupMappingConfigMapName,
		Namespace: velatypes.DefaultKubeVelaNS,
	}, cm); err != nil {
		if kerrors.IsNotFound(err) {
			return nil, bcode.ErrGroupMappingConfigNotFound
		}
		return nil, err
	}

	mapping := &model.GroupRoleMapping{
		Groups: make(map[string][]model.GroupProjectRole),
	}

	if cm.Data == nil || cm.Data[GroupMappingConfigMapKey] == "" {
		return mapping, nil
	}

	if err := yaml.Unmarshal([]byte(cm.Data[GroupMappingConfigMapKey]), mapping); err != nil {
		klog.Errorf("failed to parse velaux-rbac-cm ConfigMap: %s", err.Error())
		return nil, bcode.ErrGroupMappingInvalidConfig
	}

	if mapping.Groups == nil {
		mapping.Groups = make(map[string][]model.GroupProjectRole)
	}

	return mapping, nil
}

// validateMappings checks that all referenced projects and roles exist.
func (g *groupMappingServiceImpl) validateMappings(ctx context.Context, groups map[string][]apisv1.GroupProjectRoleBase) error {
	for groupName, roles := range groups {
		for _, pr := range roles {
			// Validate project exists
			project := &model.Project{Name: pr.Project}
			if err := g.Store.Get(ctx, project); err != nil {
				if errors.Is(err, datastore.ErrRecordNotExist) {
					klog.Errorf("group %q references non-existent project %q", groupName, pr.Project)
					return bcode.ErrGroupMappingProjectNotExist
				}
				return err
			}

			// Validate role exists in the project
			role := &model.Role{
				Name:    pr.Role,
				Project: pr.Project,
			}
			if err := g.Store.Get(ctx, role); err != nil {
				if errors.Is(err, datastore.ErrRecordNotExist) {
					klog.Errorf("group %q references non-existent role %q in project %q", groupName, pr.Role, pr.Project)
					return bcode.ErrGroupMappingRoleNotExist
				}
				return err
			}
		}
	}
	return nil
}

// convertMappingToResponse converts the internal model to the API response DTO.
func convertMappingToResponse(mapping *model.GroupRoleMapping) *apisv1.GroupMappingResponse {
	resp := &apisv1.GroupMappingResponse{
		Groups: make(map[string][]apisv1.GroupProjectRoleBase),
	}
	for group, roles := range mapping.Groups {
		for _, r := range roles {
			resp.Groups[group] = append(resp.Groups[group], apisv1.GroupProjectRoleBase{
				Project: r.Project,
				Role:    r.Role,
			})
		}
	}
	return resp
}

// mergeRoles merges existing roles with new group-managed roles, deduplicating.
func mergeRoles(existing, newRoles []string) []string {
	roleSet := make(map[string]bool)
	for _, r := range existing {
		roleSet[r] = true
	}
	for _, r := range newRoles {
		roleSet[r] = true
	}
	var result []string
	for r := range roleSet {
		result = append(result, r)
	}
	return result
}

// rolesEqual checks if two role slices contain the same roles (order-independent).
func rolesEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	set := make(map[string]bool)
	for _, r := range a {
		set[r] = true
	}
	for _, r := range b {
		if !set[r] {
			return false
		}
	}
	return true
}
