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

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

var _ = Describe("Test user functions", func() {
	var store datastore.DataStore
	BeforeEach(func() {
		var err error
		store, err = NewDatastore(datastore.Config{Type: "kubeapi", Database: "repository-user-test"})
		Expect(err).Should(BeNil())
		Expect(store).ToNot(BeNil())
	})
	It("Test list admin users", func() {
		err := store.BatchAdd(context.TODO(), []datastore.Entity{
			&model.User{Alias: "Admin", Name: "admin-user", UserRoles: []string{model.RoleAdmin}},
			&model.User{Alias: "Dev", Name: "dev-user", UserRoles: []string{}},
		})
		Expect(err).Should(BeNil())
		users, err := ListAdminUsers(context.TODO(), store)
		Expect(err).Should(BeNil())
		Expect(len(users)).Should(Equal(1))
	})
})
