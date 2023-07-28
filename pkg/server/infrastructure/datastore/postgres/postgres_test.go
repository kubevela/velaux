package postgres

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

import (
	"context"
	"math/rand"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	postgresgorm "gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

var postgresDriver datastore.DataStore
var _ = BeforeSuite(func(ctx SpecContext) {
	rand.Seed(time.Now().UnixNano())
	By("bootstrapping postgres test environment")
	db, err := gorm.Open(postgresgorm.Open("postgres://kubevela:Kubevela-123@127.0.0.1:5432/kubevela?sslmode=disable&client_encoding=UTF-8&connect_timeout=1"), &gorm.Config{})
	Expect(err).ToNot(HaveOccurred())
	for _, v := range model.GetRegisterModels() {
		err := db.Migrator().DropTable(&v)
		Expect(err).ToNot(HaveOccurred())
	}
	postgresDriver, err = New(context.TODO(), datastore.Config{
		URL:      "postgres://kubevela:Kubevela-123@127.0.0.1:5432/kubevela?sslmode=disable&client_encoding=UTF-8&connect_timeout=1",
		Database: "kubevela",
	})
	Expect(err).ToNot(HaveOccurred())
	Expect(postgresDriver).ToNot(BeNil())
	By("create postgres driver success")
}, NodeTimeout(2*time.Minute))
