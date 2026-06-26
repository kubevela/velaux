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

package bcode

var (
	// ErrGroupMappingConfigNotFound means the velaux-rbac-cm ConfigMap was not found
	ErrGroupMappingConfigNotFound = NewBcode(404, 19001, "group mapping config not found")
	// ErrGroupMappingInvalidConfig means the group mapping configuration is invalid
	ErrGroupMappingInvalidConfig = NewBcode(400, 19002, "invalid group mapping configuration")
	// ErrGroupMappingProjectNotExist means a project referenced in group mapping does not exist
	ErrGroupMappingProjectNotExist = NewBcode(400, 19003, "project in group mapping does not exist")
	// ErrGroupMappingRoleNotExist means a role referenced in group mapping does not exist
	ErrGroupMappingRoleNotExist = NewBcode(400, 19004, "role in group mapping does not exist")
)
