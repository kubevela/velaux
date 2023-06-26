/*
Copyright 2021 The KubeVela Authors.

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

package mysql

import (
	"context"
	"math/rand"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	mysqlgorm "gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

var mysqlDriver datastore.DataStore
var _ = BeforeSuite(func(ctx SpecContext) {
	rand.Seed(time.Now().UnixNano())
	By("bootstrapping mysql test environment")
	db, err := gorm.Open(mysqlgorm.Open("root:kubevelaSQL123@tcp(127.0.0.1:3306)/kubevela?parseTime=True"), &gorm.Config{})
	Expect(err).ToNot(HaveOccurred())
	for _, v := range model.GetRegisterModels() {
		err := db.Migrator().DropTable(&v)
		Expect(err).ToNot(HaveOccurred())
	}
	mysqlDriver, err = New(context.TODO(), datastore.Config{
		URL:      "root:kubevelaSQL123@tcp(127.0.0.1:3306)/kubevela?parseTime=True",
		Database: "kubevela",
	})
	Expect(err).ToNot(HaveOccurred())
	Expect(mysqlDriver).ToNot(BeNil())
	By("create mysql driver success")
}, NodeTimeout(2*time.Minute))
