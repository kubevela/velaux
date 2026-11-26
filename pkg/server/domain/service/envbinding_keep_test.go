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
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/repository"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

var _ = Describe("Removing an env binding", func() {
	var app *model.Application

	// bind stores an env and binds the app to it, then adds an approval step and an override to its workflow.
	bind := func(name string) string {
		InitTestEnv("envbinding-keep-" + name)
		app = &model.Application{Name: "ebk-" + name, Project: "default"}
		Expect(ds.Add(ctx, app)).Should(Succeed())
		Expect(ds.Add(ctx, &model.Target{Name: "ebk-" + name + "-t", Project: "default",
			Cluster: &model.ClusterTarget{ClusterName: "local", Namespace: "ebk-" + name + "-t"}})).Should(Succeed())
		env := "ebk-" + name + "-env"
		_, err := envService.CreateEnv(ctx, apisv1.CreateEnvRequest{Name: env, Project: "default", Targets: []string{"ebk-" + name + "-t"}})
		Expect(err).Should(Succeed())
		_, err = envBindingService.CreateEnvBinding(ctx, app, apisv1.CreateApplicationEnvbindingRequest{EnvBinding: apisv1.EnvBinding{Name: env}})
		Expect(err).Should(Succeed())

		wf, err := repository.GetWorkflowForApp(ctx, ds, app, repository.ConvertWorkflowName(env))
		Expect(err).Should(Succeed())
		wf.Steps = append([]model.WorkflowStep{{WorkflowStepBase: model.WorkflowStepBase{Name: "approve", Type: "suspend"}}}, wf.Steps...)
		Expect(ds.Put(ctx, wf)).Should(Succeed())
		Expect(ds.Add(ctx, &model.ApplicationPolicy{AppPrimaryKey: app.PrimaryKey(), Name: "ebk-override", Type: "override", EnvName: env})).Should(Succeed())
		return env
	}
	stepNames := func(env string) []string {
		wf, err := repository.GetWorkflowForApp(ctx, ds, app, repository.ConvertWorkflowName(env))
		Expect(err).Should(Succeed())
		var names []string
		for _, s := range wf.Steps {
			names = append(names, s.Name)
		}
		return names
	}

	It("keeps the env's workflow and policies when asked, and picks them up when the env is added back", func() {
		env := bind("keep")
		Expect(envBindingService.DeleteEnvBinding(ctx, app, env, true)).Should(Succeed())
		_, err := envBindingService.GetEnvBinding(ctx, app, env)
		Expect(err).Should(HaveOccurred())
		Expect(stepNames(env)).Should(Equal([]string{"approve", "ebk-keep-t"}))
		Expect(ds.Get(ctx, &model.ApplicationPolicy{AppPrimaryKey: app.PrimaryKey(), Name: "ebk-override"})).Should(Succeed())

		_, err = envBindingService.CreateEnvBinding(ctx, app, apisv1.CreateApplicationEnvbindingRequest{EnvBinding: apisv1.EnvBinding{Name: env}})
		Expect(err).Should(Succeed())
		Expect(stepNames(env)).Should(Equal([]string{"approve", "ebk-keep-t"}))
		Expect(ds.Get(ctx, &model.ApplicationPolicy{AppPrimaryKey: app.PrimaryKey(), Name: "ebk-override"})).Should(Succeed())
	})

	It("deletes them otherwise, as before", func() {
		env := bind("purge")
		Expect(envBindingService.DeleteEnvBinding(ctx, app, env, false)).Should(Succeed())
		_, err := repository.GetWorkflowForApp(ctx, ds, app, repository.ConvertWorkflowName(env))
		Expect(err).Should(HaveOccurred())
		Expect(ds.Get(ctx, &model.ApplicationPolicy{AppPrimaryKey: app.PrimaryKey(), Name: "ebk-override"})).ShouldNot(Succeed())
	})
})
