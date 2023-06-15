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
	"strings"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	mysqlgorm "gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

var mysqlDriver datastore.DataStore
var _ = BeforeSuite(func(done Done) {
	rand.Seed(time.Now().UnixNano())
	By("bootstrapping mysql test environment")
	db, err := gorm.Open(mysqlgorm.Open("root:kubevelaSQL123@tcp(127.0.0.1:3306)/kubevela?parseTime=True"), &gorm.Config{})
	Expect(err).ToNot(HaveOccurred())
	for _, v := range model.GetRegisterModels() {
		dbDelete := db.Where("1 = 1").Delete(v)
		Expect(dbDelete.Error).ToNot(HaveOccurred())
	}
	mysqlDriver, err = New(context.TODO(), datastore.Config{
		URL:      "root:kubevelaSQL123@tcp(127.0.0.1:3306)/kubevela?parseTime=True",
		Database: "kubevela",
	})
	Expect(err).ToNot(HaveOccurred())
	Expect(mysqlDriver).ToNot(BeNil())
	By("create mysql driver success")
	close(done)
}, 120)

var _ = Describe("Test mysql datastore driver", func() {

	It("Test add function", func() {
		err := mysqlDriver.Add(context.TODO(), &model.Application{Name: "kubevela-app", Description: "default"})
		Expect(err).ToNot(HaveOccurred())
	})

	It("Test batch add function", func() {
		var datas = []datastore.Entity{
			&model.Application{Name: "kubevela-app-2", Description: "this is demo 2"},
			&model.Application{Name: "kubevela-app-3", Description: "this is demo 3"},
			&model.Application{Name: "kubevela-app-4", Project: "test-project", Description: "this is demo 4"},
			&model.Workflow{Name: "kubevela-app-workflow", AppPrimaryKey: "kubevela-app-2", Description: "this is workflow"},
			&model.ApplicationTrigger{Name: "kubevela-app-trigger", AppPrimaryKey: "kubevela-app-2", Token: "token-test", Description: "this is demo 4"},
		}
		err := mysqlDriver.BatchAdd(context.TODO(), datas)
		Expect(err).ToNot(HaveOccurred())

		var datas2 = []datastore.Entity{
			&model.Application{Name: "can-delete", Description: "this is demo can-delete"},
			&model.Application{Name: "kubevela-app-2", Description: "this is demo 2"},
		}
		err = mysqlDriver.BatchAdd(context.TODO(), datas2)
		equal := cmp.Diff(strings.Contains(err.Error(), "save entities occur error"), true)
		Expect(equal).To(BeEmpty())
	})

	It("Test get function", func() {
		app := &model.Application{Name: "kubevela-app"}
		err := mysqlDriver.Get(context.TODO(), app)
		Expect(err).Should(BeNil())
		diff := cmp.Diff(app.Description, "default")
		Expect(diff).Should(BeEmpty())

		workflow := &model.Workflow{Name: "kubevela-app-workflow", AppPrimaryKey: "kubevela-app-2"}
		err = mysqlDriver.Get(context.TODO(), workflow)
		Expect(err).Should(BeNil())
		diff = cmp.Diff(workflow.Description, "this is workflow")
		Expect(diff).Should(BeEmpty())
	})

	It("Test put function", func() {
		err := mysqlDriver.Put(context.TODO(), &model.Application{Name: "kubevela-app", Description: "this is demo"})
		Expect(err).ToNot(HaveOccurred())
	})
	It("Test list function", func() {
		var app model.Application
		list, err := mysqlDriver.List(context.TODO(), &app, &datastore.ListOptions{Page: -1})
		Expect(err).ShouldNot(HaveOccurred())
		diff := cmp.Diff(len(list), 4)
		Expect(diff).Should(BeEmpty())

		list, err = mysqlDriver.List(context.TODO(), &app, &datastore.ListOptions{Page: 2, PageSize: 2})
		Expect(err).ShouldNot(HaveOccurred())
		diff = cmp.Diff(len(list), 2)
		Expect(diff).Should(BeEmpty())

		list, err = mysqlDriver.List(context.TODO(), &app, &datastore.ListOptions{Page: 1, PageSize: 2})
		Expect(err).ShouldNot(HaveOccurred())
		diff = cmp.Diff(len(list), 2)
		Expect(diff).Should(BeEmpty())

		list, err = mysqlDriver.List(context.TODO(), &app, nil)
		Expect(err).ShouldNot(HaveOccurred())
		diff = cmp.Diff(len(list), 4)
		Expect(diff).Should(BeEmpty())

		var workflow = model.Workflow{
			AppPrimaryKey: "kubevela-app-2",
		}
		list, err = mysqlDriver.List(context.TODO(), &workflow, nil)
		Expect(err).ShouldNot(HaveOccurred())
		diff = cmp.Diff(len(list), 1)
		Expect(diff).Should(BeEmpty())

		list, err = mysqlDriver.List(context.TODO(), &app, &datastore.ListOptions{FilterOptions: datastore.FilterOptions{In: []datastore.InQueryOption{
			{
				Key:    "name",
				Values: []string{"kubevela-app-3", "kubevela-app-2"},
			},
		}}})
		Expect(err).ShouldNot(HaveOccurred())
		diff = cmp.Diff(len(list), 2)
		Expect(diff).Should(BeEmpty())

		list, err = mysqlDriver.List(context.TODO(), &app, &datastore.ListOptions{FilterOptions: datastore.FilterOptions{IsNotExist: []datastore.IsNotExistQueryOption{
			{
				Key: "project",
			},
		}}})
		Expect(err).ShouldNot(HaveOccurred())
		diff = cmp.Diff(len(list), 3)
		Expect(diff).Should(BeEmpty())
	})

	It("Test list clusters with sort and fuzzy query", func() {
		clusters, err := mysqlDriver.List(context.TODO(), &model.Cluster{}, nil)
		Expect(err).Should(Succeed())
		for _, cluster := range clusters {
			Expect(mysqlDriver.Delete(context.TODO(), cluster)).Should(Succeed())
		}
		for _, name := range []string{"first", "second", "third"} {
			Expect(mysqlDriver.Add(context.TODO(), &model.Cluster{Name: name})).Should(Succeed())
			time.Sleep(time.Millisecond * 100)
		}
		entities, err := mysqlDriver.List(context.TODO(), &model.Cluster{}, &datastore.ListOptions{
			SortBy: []datastore.SortOption{{Key: "createTime", Order: datastore.SortOrderAscending}}})
		Expect(err).Should(Succeed())
		Expect(len(entities)).Should(Equal(3))
		for i, name := range []string{"first", "second", "third"} {
			Expect(entities[i].(*model.Cluster).Name).Should(Equal(name))
		}
		entities, err = mysqlDriver.List(context.TODO(), &model.Cluster{}, &datastore.ListOptions{
			SortBy:   []datastore.SortOption{{Key: "createTime", Order: datastore.SortOrderDescending}},
			Page:     1,
			PageSize: 2,
		})
		Expect(err).Should(Succeed())
		Expect(len(entities)).Should(Equal(2))
		for i, name := range []string{"third", "second"} {
			Expect(entities[i].(*model.Cluster).Name).Should(Equal(name))
		}
		entities, err = mysqlDriver.List(context.TODO(), &model.Cluster{}, &datastore.ListOptions{
			SortBy:   []datastore.SortOption{{Key: "createTime", Order: datastore.SortOrderDescending}},
			Page:     2,
			PageSize: 2,
		})
		Expect(err).Should(Succeed())
		Expect(len(entities)).Should(Equal(1))
		for i, name := range []string{"first"} {
			Expect(entities[i].(*model.Cluster).Name).Should(Equal(name))
		}
		entities, err = mysqlDriver.List(context.TODO(), &model.Cluster{}, &datastore.ListOptions{
			SortBy: []datastore.SortOption{{Key: "createTime", Order: datastore.SortOrderDescending}},
			FilterOptions: datastore.FilterOptions{
				Queries: []datastore.FuzzyQueryOption{{Key: "name", Query: "ir"}},
			},
		})
		Expect(err).Should(Succeed())
		Expect(len(entities)).Should(Equal(2))
		for i, name := range []string{"third", "first"} {
			Expect(entities[i].(*model.Cluster).Name).Should(Equal(name))
		}
	})

	It("Test count function", func() {
		var app model.Application
		count, err := mysqlDriver.Count(context.TODO(), &app, nil)
		Expect(err).ShouldNot(HaveOccurred())
		Expect(count).Should(Equal(int64(4)))

		count, err = mysqlDriver.Count(context.TODO(), &model.Cluster{}, &datastore.FilterOptions{
			Queries: []datastore.FuzzyQueryOption{{Key: "name", Query: "ir"}},
		})
		Expect(err).Should(Succeed())
		Expect(count).Should(Equal(int64(2)))

		count, err = mysqlDriver.Count(context.TODO(), &app, &datastore.FilterOptions{In: []datastore.InQueryOption{
			{
				Key:    "name",
				Values: []string{"kubevela-app-3", "kubevela-app-2"},
			},
		}})
		Expect(err).ShouldNot(HaveOccurred())
		Expect(count).Should(Equal(int64(2)))

		count, err = mysqlDriver.Count(context.TODO(), &app, &datastore.FilterOptions{IsNotExist: []datastore.IsNotExistQueryOption{
			{
				Key: "project",
			},
		}})
		Expect(err).ShouldNot(HaveOccurred())
		Expect(count).Should(Equal(int64(3)))

		app.Name = "kubevela-app-3"
		count, err = mysqlDriver.Count(context.TODO(), &app, &datastore.FilterOptions{})
		Expect(err).ShouldNot(HaveOccurred())
		Expect(count).Should(Equal(int64(1)))
	})

	It("Test isExist function", func() {
		var app model.Application
		app.Name = "kubevela-app-3"
		exist, err := mysqlDriver.IsExist(context.TODO(), &app)
		Expect(err).ShouldNot(HaveOccurred())
		diff := cmp.Diff(exist, true)
		Expect(diff).Should(BeEmpty())

		app.Name = "kubevela-app-5"
		notexist, err := mysqlDriver.IsExist(context.TODO(), &app)
		Expect(err).ShouldNot(HaveOccurred())
		diff = cmp.Diff(notexist, false)
		Expect(diff).Should(BeEmpty())
	})

	It("Test delete function", func() {
		var app model.Application
		app.Name = "kubevela-app"
		err := mysqlDriver.Delete(context.TODO(), &app)
		Expect(err).ShouldNot(HaveOccurred())

		app.Name = "kubevela-app-2"
		err = mysqlDriver.Delete(context.TODO(), &app)
		Expect(err).ShouldNot(HaveOccurred())

		app.Name = "kubevela-app-3"
		err = mysqlDriver.Delete(context.TODO(), &app)
		Expect(err).ShouldNot(HaveOccurred())

		app.Name = "kubevela-app-4"
		err = mysqlDriver.Delete(context.TODO(), &app)
		Expect(err).ShouldNot(HaveOccurred())

		app.Name = "kubevela-app-4"
		err = mysqlDriver.Delete(context.TODO(), &app)
		equal := cmp.Equal(err, datastore.ErrRecordNotExist, cmpopts.EquateErrors())
		Expect(equal).Should(BeTrue())

		workflow := model.Workflow{Name: "kubevela-app-workflow", AppPrimaryKey: "kubevela-app-2", Description: "this is workflow"}
		err = mysqlDriver.Delete(context.TODO(), &workflow)
		Expect(err).ShouldNot(HaveOccurred())

		trigger := model.ApplicationTrigger{Name: "kubevela-app-trigger", AppPrimaryKey: "kubevela-app-2", Token: "token-test", Description: "this is demo 4"}
		err = mysqlDriver.Delete(context.TODO(), &trigger)
		Expect(err).ShouldNot(HaveOccurred())
	})
})
