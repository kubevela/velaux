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

package kubeapi

import (
	"context"
	"fmt"

	"github.com/google/go-cmp/cmp"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/selection"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

var _ = Describe("Test kubeapi datastore driver", func() {

	It("Test application index", func() {
		var app = model.Application{
			Name: "test",
		}
		selector, err := labels.Parse(fmt.Sprintf("table=%s", app.TableName()))
		Expect(err).ToNot(HaveOccurred())
		Expect(cmp.Diff(app.Index()["name"], "test")).Should(BeEmpty())
		index := convertIndex2Labels(app.Index())
		for k, v := range index {
			rq, err := labels.NewRequirement(k, selection.Equals, []string{v})
			Expect(err).ToNot(HaveOccurred())
			selector = selector.Add(*rq)
		}
		Expect(cmp.Diff(selector.String(), "name=test,table=vela_application")).Should(BeEmpty())
	})

	It("Test workflow index", func() {
		defaultPtr := false
		var workflow = model.Workflow{
			Name:    "test",
			Default: &defaultPtr,
		}
		selector, err := labels.Parse(fmt.Sprintf("table=%s", workflow.TableName()))
		Expect(err).ToNot(HaveOccurred())
		Expect(cmp.Diff(workflow.Index()["name"], "test")).Should(BeEmpty())
		index := convertIndex2Labels(workflow.Index())
		for k, v := range index {
			rq, err := labels.NewRequirement(k, selection.Equals, []string{v})
			Expect(err).ToNot(HaveOccurred())
			selector = selector.Add(*rq)
		}
		Expect(cmp.Diff(selector.String(), "default=false,name=test,table=vela_workflow")).Should(BeEmpty())
	})

	It("Test verify index", func() {
		var usr = model.User{Name: "can@delete", Email: "xxx@xx.com"}
		err := kubeStore.Add(context.TODO(), &usr)
		Expect(err).ToNot(HaveOccurred())

		usr.Email = "change"
		err = kubeStore.Put(context.TODO(), &usr)
		Expect(err).ToNot(HaveOccurred())

		err = kubeStore.Get(context.TODO(), &usr)
		Expect(err).Should(BeNil())
		diff := cmp.Diff(usr.Email, "change")
		Expect(diff).Should(BeEmpty())

		list, err := kubeStore.List(context.TODO(), &usr, &datastore.ListOptions{FilterOptions: datastore.FilterOptions{In: []datastore.InQueryOption{
			{
				Key:    "name",
				Values: []string{"can@delete"},
			},
		}}})
		Expect(err).ShouldNot(HaveOccurred())
		diff = cmp.Diff(len(list), 1)
		Expect(diff).Should(BeEmpty())

		count, err := kubeStore.Count(context.TODO(), &usr, &datastore.FilterOptions{In: []datastore.InQueryOption{
			{
				Key:    "name",
				Values: []string{"can@delete"},
			},
		}})
		Expect(err).ShouldNot(HaveOccurred())
		Expect(count).Should(Equal(int64(1)))

		usr.Name = "can@delete"
		err = kubeStore.Delete(context.TODO(), &usr)
		Expect(err).ShouldNot(HaveOccurred())
	})
})
