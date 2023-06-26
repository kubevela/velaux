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
	"bytes"
	"context"
	"encoding/json"
	"net/http"

	"github.com/emicklei/go-restful/v3"
	"github.com/google/go-cmp/cmp"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam/util"
	"github.com/oam-dev/kubevela/pkg/utils/apply"

	workflowv1alpha1 "github.com/kubevela/workflow/api/v1alpha1"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/repository"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

var _ = Describe("Test application service function", func() {

	BeforeEach(func() {
		InitTestEnv("app-test-kubevela")
		workflowService = &workflowServiceImpl{
			Store:             ds,
			KubeClient:        k8sClient,
			Apply:             apply.NewAPIApplicator(k8sClient),
			EnvService:        envService,
			EnvBindingService: envBindingService,
		}
		webhookService = &webhookServiceImpl{
			Store:              ds,
			ApplicationService: appService,
			WorkflowService:    workflowService,
		}
	})

	It("Test HandleApplicationWebhook function", func() {
		var ns = corev1.Namespace{}
		ns.Name = types.DefaultKubeVelaNS
		err := k8sClient.Create(context.TODO(), &ns)
		Expect(err).Should(SatisfyAny(BeNil(), &util.AlreadyExistMatcher{}))

		_, err = projectService.CreateProject(context.TODO(), apisv1.CreateProjectRequest{Name: "project-webhook"})
		Expect(err).Should(BeNil())

		_, err = targetService.CreateTarget(context.TODO(), apisv1.CreateTargetRequest{Name: "dev-target-webhook", Project: "project-webhook"})
		Expect(err).Should(BeNil())

		_, err = envService.CreateEnv(context.TODO(), apisv1.CreateEnvRequest{Name: "webhook-dev", Namespace: "webhook-dev", Targets: []string{"dev-target-webhook"}, Project: "project-webhook"})
		Expect(err).Should(BeNil())

		Expect(err).Should(BeNil())
		req := apisv1.CreateApplicationRequest{
			Name:        "test-app-webhook",
			Project:     "project-webhook",
			Description: "this is a test app",
			EnvBinding: []*apisv1.EnvBinding{{
				Name: "webhook-dev",
			}},
			Component: &apisv1.CreateComponentRequest{
				Name:          "component-name-webhook",
				ComponentType: "webservice",
			},
		}
		_, err = appService.CreateApplication(context.TODO(), req)
		Expect(err).Should(BeNil())

		appModel, err := appService.GetApplication(context.TODO(), "test-app-webhook")
		Expect(err).Should(BeNil())

		workflowReq := &apisv1.CreateWorkflowRequest{
			Name:    "workflow-webhook-dev",
			EnvName: "webhook-dev",
			Steps: []apisv1.WorkflowStep{
				{
					WorkflowStepBase: apisv1.WorkflowStepBase{
						Name: "suspend",
						Type: "suspend",
					},
				},
			},
		}

		_, err = workflowService.CreateOrUpdateWorkflow(context.TODO(), appModel, *workflowReq)
		Expect(err).Should(BeNil())

		_, err = webhookService.HandleApplicationWebhook(context.TODO(), "invalid-token", nil)
		Expect(err).Should(Equal(bcode.ErrInvalidWebhookToken))

		triggers, err := appService.ListApplicationTriggers(context.TODO(), appModel)
		Expect(err).Should(BeNil())

		invalidReq, err := http.NewRequest("post", "/", bytes.NewBuffer([]byte(`{"upgrade": "test"}`)))
		invalidReq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), triggers[0].Token, restful.NewRequest(invalidReq))
		Expect(err).Should(Equal(bcode.ErrInvalidWebhookPayloadBody))

		By("Test HandleApplicationWebhook function with custom payload")
		reqBody := apisv1.HandleApplicationTriggerWebhookRequest{
			Upgrade: map[string]*model.JSONStruct{
				"component-name-webhook": {
					"image": "test-image",
					"test1": map[string]string{
						"test2": "test3",
					},
				},
			},
			CodeInfo: &model.CodeInfo{
				Commit: "test-commit",
				Branch: "test-branch",
				User:   "test-user",
			},
		}
		body, err := json.Marshal(reqBody)
		Expect(err).Should(BeNil())
		httpreq, err := http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		res, err := webhookService.HandleApplicationWebhook(context.TODO(), triggers[0].Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())
		appDeployRes := res.(*apisv1.ApplicationDeployResponse)
		comp, err := appService.GetApplicationComponent(context.TODO(), appModel, "component-name-webhook")
		Expect(err).Should(BeNil())
		Expect((*comp.Properties)["image"]).Should(Equal("test-image"))
		Expect((*comp.Properties)["test1"]).Should(Equal(map[string]interface{}{
			"test2": "test3",
		}))

		revision := &model.ApplicationRevision{
			AppPrimaryKey: "test-app-webhook",
			Version:       appDeployRes.Version,
		}
		err = webhookService.Store.Get(context.TODO(), revision)
		Expect(err).Should(BeNil())
		Expect(revision.CodeInfo.Commit).Should(Equal("test-commit"))
		Expect(revision.CodeInfo.Branch).Should(Equal("test-branch"))
		Expect(revision.CodeInfo.User).Should(Equal("test-user"))

		By("Test HandleApplicationWebhook function with custom payload and execute as action type")
		executeReq := apisv1.HandleApplicationTriggerWebhookRequest{
			Upgrade: map[string]*model.JSONStruct{
				"component-name-webhook": {
					"image": "test-image",
					"test1": map[string]string{
						"test2": "test3",
					},
				},
			},
			CodeInfo: &model.CodeInfo{
				Commit: "test-commit",
				Branch: "test-branch",
				User:   "test-user",
			},
			Action: "execute",
		}
		body, err = json.Marshal(executeReq)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		res, err = webhookService.HandleApplicationWebhook(context.TODO(), triggers[0].Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())
		appDeployRes = res.(*apisv1.ApplicationDeployResponse)
		comp, err = appService.GetApplicationComponent(context.TODO(), appModel, "component-name-webhook")
		Expect(err).Should(BeNil())
		Expect((*comp.Properties)["image"]).Should(Equal("test-image"))
		Expect((*comp.Properties)["test1"]).Should(Equal(map[string]interface{}{
			"test2": "test3",
		}))

		revision = &model.ApplicationRevision{
			AppPrimaryKey: "test-app-webhook",
			Version:       appDeployRes.Version,
		}
		err = webhookService.Store.Get(context.TODO(), revision)
		Expect(err).Should(BeNil())
		Expect(revision.CodeInfo.Commit).Should(Equal("test-commit"))
		Expect(revision.CodeInfo.Branch).Should(Equal("test-branch"))
		Expect(revision.CodeInfo.User).Should(Equal("test-user"))

		By("Test HandleApplicationWebhook function with custom payload and approve as action type")

		appName = "resume-webhook-trigger"

		_, err = envService.CreateEnv(context.TODO(), apisv1.CreateEnvRequest{Name: "resume-webhook"})
		Expect(err).Should(BeNil())
		_, err = envBindingService.CreateEnvBinding(context.TODO(), &model.Application{Name: appName}, apisv1.CreateApplicationEnvbindingRequest{EnvBinding: apisv1.EnvBinding{Name: "resume-webhook"}})
		Expect(err).Should(BeNil())

		resumeWebhookReq := apisv1.CreateApplicationRequest{
			Name:        appName,
			Project:     "project-webhook",
			Description: "this is a test app",
			EnvBinding: []*apisv1.EnvBinding{{
				Name: "resume-webhook",
			}},
		}
		_, err = appService.CreateApplication(context.TODO(), resumeWebhookReq)
		Expect(err).Should(BeNil())

		ResumeWorkflow := "workflow-resume-webhook"
		wfreq := apisv1.CreateWorkflowRequest{
			Name:        ResumeWorkflow,
			Description: "this is a workflow",
			EnvName:     "resume-webhook",
		}

		base, err := workflowService.CreateOrUpdateWorkflow(context.TODO(), &model.Application{
			Name: appName,
		}, wfreq)
		Expect(err).Should(BeNil())
		Expect(cmp.Diff(base.Name, wfreq.Name)).Should(BeEmpty())

		app, err := createTestSuspendApp(ctx, appName, "resume-webhook", "revision-resume1", ResumeWorkflow, "workflow-resume-1", workflowService.KubeClient)
		Expect(err).Should(BeNil())

		resumeTrigeres, err := appService.ListApplicationTriggers(context.TODO(), &model.Application{
			Name: appName,
		})
		Expect(err).Should(BeNil())

		_, err = workflowService.CreateWorkflowRecord(context.TODO(), &model.Application{
			Name: appName,
		}, app, &model.Workflow{Name: ResumeWorkflow})
		Expect(err).Should(BeNil())

		err = workflowService.createTestApplicationRevision(ctx, &model.ApplicationRevision{
			AppPrimaryKey:  appName,
			Version:        "revision-resume1",
			RevisionCRName: "revision-resume1",
			Status:         model.RevisionStatusRunning,
		})
		Expect(err).Should(BeNil())

		resumeTriggerReq := apisv1.HandleApplicationTriggerWebhookRequest{
			Action: "approve",
		}
		body, err = json.Marshal(resumeTriggerReq)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), resumeTrigeres[0].Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())

		err = workflowService.SyncWorkflowRecord(ctx, appName, "workflow-resume-1", app, nil)
		Expect(err).Should(BeNil())

		record, err := workflowService.DetailWorkflowRecord(ctx, &model.Workflow{Name: ResumeWorkflow, AppPrimaryKey: appName}, "workflow-resume-1")
		Expect(err).Should(BeNil())
		Expect(len(record.Steps)).Should(Equal(1))
		Expect(record.Steps[0].Phase).Should(Equal(workflowv1alpha1.WorkflowStepPhaseRunning))

		By("Test HandleApplicationWebhook function with custom payload and terminate as action type")

		appName = "terminate-webhook-trigger"

		_, err = envService.CreateEnv(context.TODO(), apisv1.CreateEnvRequest{Name: "terminate-webhook"})
		Expect(err).Should(BeNil())
		_, err = envBindingService.CreateEnvBinding(context.TODO(), &model.Application{Name: appName}, apisv1.CreateApplicationEnvbindingRequest{EnvBinding: apisv1.EnvBinding{Name: "terminate-webhook"}})
		Expect(err).Should(BeNil())

		terminateAppReq := apisv1.CreateApplicationRequest{
			Name:        appName,
			Project:     "project-webhook",
			Description: "this is a test app",
			EnvBinding: []*apisv1.EnvBinding{{
				Name: "terminate-webhook",
			}},
		}
		_, err = appService.CreateApplication(context.TODO(), terminateAppReq)
		Expect(err).Should(BeNil())

		terminateWorkflow := "workflow-terminate-webhook"
		terminateWfReq := apisv1.CreateWorkflowRequest{
			Name:        terminateWorkflow,
			Description: "this is a workflow",
			EnvName:     "terminate-webhook",
		}

		base, err = workflowService.CreateOrUpdateWorkflow(context.TODO(), &model.Application{
			Name: appName,
		}, terminateWfReq)
		Expect(err).Should(BeNil())
		Expect(cmp.Diff(base.Name, terminateWfReq.Name)).Should(BeEmpty())

		app, err = createTestSuspendApp(ctx, appName, "terminate-webhook", "revision-terminate1", terminateWorkflow, "test-workflow-2-1", workflowService.KubeClient)
		Expect(err).Should(BeNil())

		terminateTrigeres, err := appService.ListApplicationTriggers(context.TODO(), &model.Application{
			Name: appName,
		})
		Expect(err).Should(BeNil())

		_, err = workflowService.CreateWorkflowRecord(context.TODO(), &model.Application{
			Name: appName,
		}, app, &model.Workflow{Name: terminateWorkflow})
		Expect(err).Should(BeNil())

		err = workflowService.createTestApplicationRevision(ctx, &model.ApplicationRevision{
			AppPrimaryKey: appName,
			Version:       "revision-terminate1",
			Status:        model.RevisionStatusRunning,
		})
		Expect(err).Should(BeNil())

		terminateTriggerReq := apisv1.HandleApplicationTriggerWebhookRequest{
			Action: "terminate",
		}
		body, err = json.Marshal(terminateTriggerReq)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), terminateTrigeres[0].Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())

		err = k8sClient.Get(ctx, client.ObjectKey{Name: appName, Namespace: "terminate-webhook"}, app)
		Expect(err).Should(BeNil())
		err = workflowService.SyncWorkflowRecord(ctx, appName, "test-workflow-2-1", app, nil)
		Expect(err).Should(BeNil())

		record, err = workflowService.DetailWorkflowRecord(ctx, &model.Workflow{Name: terminateWorkflow}, "test-workflow-2-1")
		Expect(err).Should(BeNil())
		Expect(len(record.Steps)).Should(Equal(1))
		Expect(record.Steps[0].Phase).Should(Equal(workflowv1alpha1.WorkflowStepPhaseFailed))

		By("Test HandleApplicationWebhook function with custom payload and rollback as action type")

		appName = "rollback-webhook-trigger"
		_, err = envService.CreateEnv(context.TODO(), apisv1.CreateEnvRequest{Name: "rollback-webhook"})
		Expect(err).Should(BeNil())
		_, err = envBindingService.CreateEnvBinding(context.TODO(), &model.Application{Name: appName}, apisv1.CreateApplicationEnvbindingRequest{EnvBinding: apisv1.EnvBinding{Name: "rollback-webhook"}})
		Expect(err).Should(BeNil())

		resumeAppReq := apisv1.CreateApplicationRequest{
			Name:        appName,
			Project:     "project-webhook",
			Description: "this is a test app",
			EnvBinding: []*apisv1.EnvBinding{{
				Name: "rollback-webhook",
			}},
		}
		_, err = appService.CreateApplication(context.TODO(), resumeAppReq)
		Expect(err).Should(BeNil())

		workflowName := "workflow-rollback-webhook"
		resumeWfReq := apisv1.CreateWorkflowRequest{
			Name:        workflowName,
			Description: "this is a workflow",
			EnvName:     "rollback-webhook",
		}
		base, err = workflowService.CreateOrUpdateWorkflow(context.TODO(), &model.Application{
			Name: appName,
		}, resumeWfReq)
		Expect(err).Should(BeNil())
		Expect(cmp.Diff(base.Name, resumeWfReq.Name)).Should(BeEmpty())

		app, err = createTestSuspendApp(ctx, appName, "rollback-webhook", "revision-rollback1", workflowName, "test-workflow-2-2", workflowService.KubeClient)
		Expect(err).Should(BeNil())

		rollbackTrigeres, err := appService.ListApplicationTriggers(context.TODO(), &model.Application{
			Name: appName,
		})
		Expect(err).Should(BeNil())

		rollbackRecord, err := workflowService.CreateWorkflowRecord(context.TODO(), &model.Application{
			Name: appName,
		}, app, &model.Workflow{Name: workflowName})
		Expect(err).Should(BeNil())

		err = workflowService.createTestApplicationRevision(ctx, &model.ApplicationRevision{
			AppPrimaryKey: appName,
			Version:       "revision-rollback1",
			Status:        model.RevisionStatusRunning,
			WorkflowName:  workflowName,
			EnvName:       "rollback-webhook",
		})
		Expect(err).Should(BeNil())
		err = workflowService.createTestApplicationRevision(ctx, &model.ApplicationRevision{
			AppPrimaryKey:  appName,
			Version:        "revision-rollback0",
			ApplyAppConfig: `{"apiVersion":"core.oam.dev/v1beta1","kind":"Application","metadata":{"annotations":{"app.oam.dev/workflowName":"test-workflow-2-2","app.oam.dev/deployVersion":"revision-rollback1","vela.io/publish-version":"workflow-rollback1"},"name":"first-vela-app","namespace":"default"},"spec":{"components":[{"name":"express-server","properties":{"image":"crccheck/hello-world","port":8000},"traits":[{"properties":{"domain":"testsvc.example.com","http":{"/":8000}},"type":"ingress-1-20"}],"type":"webservice"}]}}`,
			Status:         model.RevisionStatusComplete,
			WorkflowName:   workflowName,
			EnvName:        "rollback-webhook",
		})
		Expect(err).Should(BeNil())

		err = workflowService.SyncWorkflowRecord(context.TODO(), appName, rollbackRecord.Name, app, nil)
		Expect(err).Should(BeNil())

		rollbackTriggerReq := apisv1.HandleApplicationTriggerWebhookRequest{
			Action: "rollback",
		}
		body, err = json.Marshal(rollbackTriggerReq)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), rollbackTrigeres[0].Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())

		recordsNum, err := workflowService.Store.Count(ctx, &model.WorkflowRecord{
			AppPrimaryKey:      appName,
			WorkflowName:       workflowName,
			RevisionPrimaryKey: "revision-rollback0",
		}, nil)
		Expect(err).Should(BeNil())
		Expect(recordsNum).Should(Equal(int64(1)))

		By("Test HandleApplicationWebhook function with custom payload and invalid action type")
		invalidActionReq := apisv1.HandleApplicationTriggerWebhookRequest{
			Action: "invalid",
			Step:   "suspend",
		}
		body, err = json.Marshal(invalidActionReq)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), triggers[0].Token, restful.NewRequest(httpreq))
		Expect(err).Should(Equal(bcode.ErrInvalidWebhookPayloadBody))

		By("Test HandleApplicationWebhook function with ACR payload")
		acrTrigger, err := appService.CreateApplicationTrigger(context.TODO(), appModel, apisv1.CreateApplicationTriggerRequest{
			Name:          "test-acr",
			PayloadType:   "acr",
			Type:          "webhook",
			WorkflowName:  repository.ConvertWorkflowName("webhook-dev"),
			ComponentName: "component-name-webhook",
		})
		Expect(err).Should(BeNil())

		acrBody := apisv1.HandleApplicationTriggerACRRequest{
			PushData: apisv1.ACRPushData{
				Digest: "test-digest",
				Tag:    "test-tag",
			},
			Repository: apisv1.ACRRepository{
				Name:         "test-repo",
				Namespace:    "test-namespace",
				Region:       "test-region",
				RepoFullName: "test-namespace/test-repo",
				RepoType:     "public",
			},
		}
		body, err = json.Marshal(acrBody)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), acrTrigger.Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())
		comp, err = appService.GetApplicationComponent(context.TODO(), appModel, "component-name-webhook")
		Expect(err).Should(BeNil())
		Expect((*comp.Properties)["image"]).Should(Equal("registry.test-region.aliyuncs.com/test-namespace/test-repo:test-tag"))

		By("Test HandleApplicationWebhook function with ACR payload and registry info")
		acrTrigger, err = appService.CreateApplicationTrigger(context.TODO(), appModel, apisv1.CreateApplicationTriggerRequest{
			Name:          "test-acr",
			PayloadType:   "acr",
			Type:          "webhook",
			ComponentName: "component-name-webhook",
			WorkflowName:  repository.ConvertWorkflowName("webhook-dev"),
			Registry:      "test-enterprise-registry.test-region.cr.aliyuncs.com",
		})
		Expect(err).Should(BeNil())

		acrBody = apisv1.HandleApplicationTriggerACRRequest{
			PushData: apisv1.ACRPushData{
				Digest: "test-digest",
				Tag:    "test-tag",
			},
			Repository: apisv1.ACRRepository{
				Name:         "test-repo",
				Namespace:    "test-namespace",
				Region:       "test-region",
				RepoFullName: "test-namespace/test-repo",
				RepoType:     "public",
			},
		}
		body, err = json.Marshal(acrBody)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), acrTrigger.Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())
		comp, err = appService.GetApplicationComponent(context.TODO(), appModel, "component-name-webhook")
		Expect(err).Should(BeNil())
		Expect((*comp.Properties)["image"]).Should(Equal("test-enterprise-registry.test-region.cr.aliyuncs.com/test-namespace/test-repo:test-tag"))

		By("Test HandleApplicationWebhook function with harbor payload")
		harborTrigger, err := appService.CreateApplicationTrigger(context.TODO(), appModel, apisv1.CreateApplicationTriggerRequest{
			Name:          "test-harbor",
			PayloadType:   "harbor",
			Type:          "webhook",
			ComponentName: "component-name-webhook",
			WorkflowName:  repository.ConvertWorkflowName("webhook-dev"),
		})
		Expect(err).Should(BeNil())

		harborBody := apisv1.HandleApplicationHarborReq{
			Type: model.HarborEventTypePushArtifact,
			EventData: apisv1.EventData{
				Resources: []apisv1.Resources{
					{
						Digest:      "test-digest",
						Tag:         "test-tag",
						ResourceURL: "harbor.server/test-pro/test-repo:test-tag",
					},
				},
				Repository: apisv1.Repository{
					Name:         "test-repo",
					Namespace:    "test-namespace",
					RepoFullName: "test-pro/test-repo",
					RepoType:     "public",
				},
			},
		}
		body, err = json.Marshal(harborBody)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), harborTrigger.Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())
		comp, err = appService.GetApplicationComponent(context.TODO(), appModel, "component-name-webhook")
		Expect(err).Should(BeNil())
		Expect((*comp.Properties)["image"]).Should(Equal("harbor.server/test-pro/test-repo:test-tag"))

		By("Test HandleApplicationWebhook function with dockerhub payload")
		dockerhubTrigger, err := appService.CreateApplicationTrigger(context.TODO(), appModel, apisv1.CreateApplicationTriggerRequest{
			Name:          "test-dockerhub",
			PayloadType:   "dockerhub",
			Type:          "webhook",
			ComponentName: "component-name-webhook",
			WorkflowName:  repository.ConvertWorkflowName("webhook-dev"),
		})
		Expect(err).Should(BeNil())

		dockerhubBody := apisv1.HandleApplicationTriggerDockerHubRequest{
			PushData: apisv1.DockerHubData{
				Tag: "test-tag",
			},
			Repository: apisv1.DockerHubRepository{
				IsPrivate: true,
				Name:      "test-repo",
				Namespace: "test-namespace",
				RepoName:  "test-namespace/test-repo",
				Status:    "Active",
			},
		}
		body, err = json.Marshal(dockerhubBody)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), dockerhubTrigger.Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())
		comp, err = appService.GetApplicationComponent(context.TODO(), appModel, "component-name-webhook")
		Expect(err).Should(BeNil())
		Expect((*comp.Properties)["image"]).Should(Equal("docker.io/test-namespace/test-repo:test-tag"))

		By("Test HandleApplicationWebhook function with jfrog payload without header of X-JFrogURL")
		jfrogTrigger, err := appService.CreateApplicationTrigger(context.TODO(), appModel, apisv1.CreateApplicationTriggerRequest{
			Name:          "test-jfrog",
			PayloadType:   "jfrog",
			Type:          "webhook",
			ComponentName: "component-name-webhook",
			WorkflowName:  repository.ConvertWorkflowName("webhook-dev"),
		})
		Expect(err).Should(BeNil())
		jfrogBody := apisv1.HandleApplicationTriggerJFrogRequest{
			Domain:    "docker",
			EventType: "pushed",
			Data: apisv1.JFrogWebhookData{
				ImageName: "test-image",
				RepoKey:   "test-repo",
				Digest:    "test-digest",
				Tag:       "test-tag",
			},
		}
		body, err = json.Marshal(jfrogBody)
		Expect(err).Should(BeNil())
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		Expect(err).Should(BeNil())
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), jfrogTrigger.Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())
		comp, err = appService.GetApplicationComponent(context.TODO(), appModel, "component-name-webhook")
		Expect(err).Should(BeNil())
		Expect((*comp.Properties)["image"]).Should(Equal("test-repo/test-image:test-tag"))

		By("Test HandleApplicationWebhook function with jfrog payload with header of X-JFrogURL")
		httpreq, err = http.NewRequest("post", "/", bytes.NewBuffer(body))
		Expect(err).Should(BeNil())
		httpreq.Header.Add(restful.HEADER_ContentType, "application/json")
		httpreq.Header.Add("X-JFrogURL", "test-addr")
		_, err = webhookService.HandleApplicationWebhook(context.TODO(), jfrogTrigger.Token, restful.NewRequest(httpreq))
		Expect(err).Should(BeNil())
		comp, err = appService.GetApplicationComponent(context.TODO(), appModel, "component-name-webhook")
		Expect(err).Should(BeNil())
		Expect((*comp.Properties)["image"]).Should(Equal("test-addr/test-repo/test-image:test-tag"))
	})
})
