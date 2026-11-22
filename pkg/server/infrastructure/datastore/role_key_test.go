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

package datastore_test

import (
	"context"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	mysqlgorm "gorm.io/driver/mysql"
	postgresorm "gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/mysql"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/postgres"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/sqlnamer"
)

const (
	mysqlTestURL    = "root:kubevelaSQL123@tcp(127.0.0.1:3306)/kubevela?parseTime=True"
	postgresTestURL = "postgres://kubevela:Kubevela-123@127.0.0.1:5432/kubevela?sslmode=disable&client_encoding=UTF-8&connect_timeout=1"
)

// keyedByNameRole is the vela_role table as releases up to v1.10 created it, keyed by name alone.
type keyedByNameRole struct {
	model.BaseModel
	Name        string `gorm:"primaryKey"`
	Alias       string
	Project     string
	Permissions []string `gorm:"serializer:json"`
}

func (keyedByNameRole) TableName() string { return "vela_role" }

var _ = Describe("Role table created by an earlier release", func() {
	DescribeTable("keeps project roles with the same name apart once the datastore starts",
		func(dialector gorm.Dialector, start func() (datastore.DataStore, error)) {
			db, err := gorm.Open(dialector, &gorm.Config{NamingStrategy: sqlnamer.SQLNamer{}})
			Expect(err).ToNot(HaveOccurred())
			Expect(db.Migrator().DropTable(&keyedByNameRole{})).To(Succeed())
			Expect(db.AutoMigrate(&keyedByNameRole{})).To(Succeed())
			now := time.Now()
			Expect(db.Create(&keyedByNameRole{BaseModel: model.BaseModel{CreateTime: now, UpdateTime: now},
				Name: "project-admin", Project: "alpha", Alias: "Alpha Admin"}).Error).To(Succeed())

			ds, err := start()
			Expect(err).ToNot(HaveOccurred())

			ctx := context.TODO()
			Expect(ds.Add(ctx, &model.Role{Name: "project-admin", Project: "beta", Alias: "Beta Admin"})).To(Succeed())

			alpha := &model.Role{Name: "project-admin", Project: "alpha"}
			Expect(ds.Get(ctx, alpha)).To(Succeed())
			Expect(alpha.Alias).To(Equal("Alpha Admin"))
			beta := &model.Role{Name: "project-admin", Project: "beta"}
			Expect(ds.Get(ctx, beta)).To(Succeed())
			Expect(beta.Alias).To(Equal("Beta Admin"))

			By("starting again on the widened table")
			_, err = start()
			Expect(err).ToNot(HaveOccurred())
		},
		Entry("mysql", mysqlgorm.Open(mysqlTestURL), func() (datastore.DataStore, error) {
			return mysql.New(context.TODO(), datastore.Config{URL: mysqlTestURL, Database: "kubevela"})
		}),
		Entry("postgres", postgresorm.Open(postgresTestURL), func() (datastore.DataStore, error) {
			return postgres.New(context.TODO(), datastore.Config{URL: postgresTestURL, Database: "kubevela"})
		}),
	)
})
