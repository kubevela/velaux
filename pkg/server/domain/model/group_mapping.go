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

package model

// GroupRoleMapping defines the structure parsed from velaux-rbac-cm ConfigMap.
// It maps OIDC group names to a list of project/role assignments.
type GroupRoleMapping struct {
	Groups map[string][]GroupProjectRole `json:"groups"`
}

// GroupProjectRole maps a group membership to a specific project and role within that project.
type GroupProjectRole struct {
	Project string `json:"project"`
	Role    string `json:"role"`
}
