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

	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// requireAuthorizedProject refuses a write to project when the request was authorized for
// another. The permission filter authorizes the project in the path or query, and a create
// carries its project in the body, so the two are compared here. A request authorized with
// no project held a permission over every project; a call with no request behind it, such
// as the server's own, carries no project and is not limited.
func requireAuthorizedProject(ctx context.Context, project string) error {
	if authorized, ok := utils.ProjectFrom(ctx); ok && authorized != "" && authorized != project {
		return bcode.ErrProjectNotAuthorized
	}
	return nil
}
