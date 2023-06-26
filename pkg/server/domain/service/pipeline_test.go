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

package service

import (
	"context"

	"github.com/kubevela/workflow/api/v1alpha1"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

var (
	ctx context.Context

	pipelineName = "test-pipeline"
	projectName  = "test-project"
)
var _ = Describe("Test pipeline service functions", func() {
	It("Init services and project", func() {
		InitTestEnv("pipeline-test-kubevela")
		ok, err := InitTestAdmin(userService)
		Expect(err).Should(BeNil())
		Expect(ok).Should(BeTrue())

		ctx = context.WithValue(context.TODO(), &apisv1.CtxKeyUser, FakeAdminName)
		_, err = projectService.CreateProject(ctx, apisv1.CreateProjectRequest{
			Name:  projectName,
			Owner: FakeAdminName,
		})
		Expect(err).Should(BeNil())
		projModel, err := projectService.GetProject(context.TODO(), projectName)
		Expect(err).Should(BeNil())
		ctx = context.WithValue(ctx, &apisv1.CtxKeyProject, projModel)
	})

	It("Init the platform", func() {
		ok, err := InitTestAdmin(userService)
		Expect(err).Should(BeNil())
		Expect(ok).Should(BeTrue())
	})

	It("Test create pipeline", func() {
		props := model.JSONStruct{
			"url": "https://api.github.com/repos/kubevela/kubevela",
		}
		testPipelineSteps := []model.WorkflowStep{
			{
				SubSteps: []model.WorkflowStepBase{
					{
						Name: "request",
						Type: "request",
						Outputs: v1alpha1.StepOutputs{
							{
								ValueFrom: "import \"strconv\"\n\"Current star count: \" + strconv.FormatInt(response[\"stargazers_count\"], 10)\n",
								Name:      "stars",
							},
						},
						Properties: &props,
					},
				},
				Mode: "StepByStep",
				WorkflowStepBase: model.WorkflowStepBase{
					Name: "step-group",
					Type: "step-group",
				},
			},
		}

		By("create pipeline with sub-steps")
		pipeline, err := pipelineService.CreatePipeline(ctx, apisv1.CreatePipelineRequest{
			Name: pipelineName,
			Spec: model.WorkflowSpec{
				Steps: testPipelineSteps,
			},
		})
		Expect(err).Should(BeNil())
		Expect(pipeline.Name).Should(Equal(pipelineName))
		Expect(pipeline.Spec.Steps[0].Name).Should(Equal("step-group"))
		Expect(string(pipeline.Spec.Steps[0].Mode)).Should(Equal("StepByStep"))
	})

	It("list pipeline", func() {
		pipelines, err := pipelineService.ListPipelines(ctx, apisv1.ListPipelineRequest{
			Detailed: true,
		})
		Expect(err).Should(BeNil())
		Expect(pipelines).ShouldNot(BeNil())
		Expect(pipelines.Total).Should(Equal(1))
		Expect(len(pipelines.Pipelines)).Should(Equal(1))
		Expect(pipelines.Pipelines[0].Info).ShouldNot(BeNil())

		pipelinesFilterByProject, err := pipelineService.ListPipelines(ctx, apisv1.ListPipelineRequest{
			Detailed: true,
			Projects: []string{"not-found"},
		})
		Expect(err).Should(BeNil())
		Expect(len(pipelinesFilterByProject.Pipelines)).Should(Equal(0))
	})

	It("get pipeline contexts", func() {
		By("no context")
		contexts, err := contextService.ListContexts(ctx, projectName, pipelineName)
		Expect(err).Should(BeNil())
		Expect(contexts.Total).Should(Equal(0))
		Expect(len(contexts.Contexts)).Should(Equal(0))

		By("create context")
		contextName := "test-context"
		contextKey := "test-key"
		contextVal := "test-val"
		ppCtx := apisv1.Context{
			Name: contextName,
			Values: []model.Value{
				{
					Key:   contextKey,
					Value: contextVal,
				},
			},
		}
		context, err := contextService.CreateContext(ctx, projectName, pipelineName, ppCtx)
		Expect(err).Should(BeNil())
		Expect(len(context.Contexts)).Should(Equal(1))
	})
})
