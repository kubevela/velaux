/*
Copyright 2023 The KubeVela Authors.

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

package repository

import (
	"context"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

// ListAdminUsers list the users which have the admin role
func ListAdminUsers(ctx context.Context, store datastore.DataStore) ([]*model.User, error) {
	user := &model.User{}
	users, err := store.List(ctx, user, nil)
	if err != nil {
		return nil, err
	}
	var admins []*model.User
	for _, u := range users {
		user := u.(*model.User)
		if user.IsAdmin() {
			admins = append(admins, user)
		}
	}
	return admins, nil
}
