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

package repository

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

var _ = Describe("Env workflows of apps from the cluster", func() {
	var store datastore.DataStore
	BeforeEach(func() {
		var err error
		store, err = NewDatastore(datastore.Config{Type: "kubeapi", Database: "workflow-synced-app"})
		Expect(err).Should(BeNil())
	})

	// setUp stores an app bound to one env, whose workflow deploys through the app's own topology policy.
	setUp := func(name string, labels map[string]string) (*model.Application, *model.Workflow) {
		app := &model.Application{Name: name, Project: "default", Labels: labels}
		env := &model.Env{Name: name + "-env", Project: "default", Namespace: name + "-env", Targets: []string{name + "-target"}}
		target := &model.Target{Name: name + "-target", Project: "default", Cluster: &model.ClusterTarget{ClusterName: "local", Namespace: name + "-target"}}
		binding := &model.EnvBinding{AppPrimaryKey: app.PrimaryKey(), Name: env.Name}
		topology := &model.ApplicationPolicy{AppPrimaryKey: app.PrimaryKey(), Name: "own-placement", Type: "topology", EnvName: env.Name,
			Properties: &model.JSONStruct{"clusters": []interface{}{"spoke"}, "namespace": "elsewhere"}}
		workflow := &model.Workflow{AppPrimaryKey: app.PrimaryKey(), Name: ConvertWorkflowName(env.Name), EnvName: env.Name,
			Steps: []model.WorkflowStep{{WorkflowStepBase: model.WorkflowStepBase{Name: "deploy-own", Type: "deploy",
				Properties: &model.JSONStruct{"policies": []interface{}{"own-placement"}}}}}}
		web := &model.ApplicationComponent{AppPrimaryKey: app.PrimaryKey(), Name: "web", Type: "webservice"}
		Expect(store.BatchAdd(context.TODO(), []datastore.Entity{app, env, target, binding, topology, workflow, web})).Should(Succeed())
		By("adding a second component")
		Expect(store.Add(context.TODO(), &model.ApplicationComponent{AppPrimaryKey: app.PrimaryKey(), Name: "side", Type: "webservice"})).Should(Succeed())
		Expect(UpdateAppEnvWorkflow(context.TODO(), k8sClient, store, app)).Should(Succeed())
		got, err := GetWorkflowForApp(context.TODO(), store, app, workflow.Name)
		Expect(err).Should(Succeed())
		return app, got
	}

	It("leaves the workflow and policies of an app synced from the cluster alone", func() {
		app, wf := setUp("wsa-cli", map[string]string{model.LabelSyncNamespace: "wsa-cli-env"})
		Expect(wf.Steps).Should(HaveLen(1))
		Expect(wf.Steps[0].Name).Should(Equal("deploy-own"))
		Expect(store.Get(context.TODO(), &model.ApplicationPolicy{AppPrimaryKey: app.PrimaryKey(), Name: "own-placement"})).Should(Succeed())
	})

	It("still regenerates the deploy steps of an app made in VelaUX", func() {
		_, wf := setUp("wsa-ui", nil)
		var names []string
		for _, s := range wf.Steps {
			names = append(names, s.Name)
		}
		Expect(names).Should(ContainElement("wsa-ui-target"))
	})
})
