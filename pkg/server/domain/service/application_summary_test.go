package service

import (
	"testing"

	workflowv1alpha1 "github.com/kubevela/workflow/api/v1alpha1"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/stretchr/testify/assert"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

func envStatus(env string, phase common.ApplicationPhase, workflow string, healthy ...bool) *apisv1.ApplicationStatusResponse {
	st := &common.AppStatus{Phase: phase}
	if workflow != "" {
		st.Workflow = &common.WorkflowStatus{Phase: workflowv1alpha1.WorkflowRunPhase(workflow)}
	}
	for _, h := range healthy {
		st.Services = append(st.Services, common.ApplicationComponentStatus{Healthy: h})
	}
	return &apisv1.ApplicationStatusResponse{EnvName: env, Status: &apisv1.ApplicationStatus{AppStatus: *st}}
}

func TestSummariseAppStatus(t *testing.T) {
	cases := map[string]struct {
		envs       []*apisv1.ApplicationStatusResponse
		health     string
		workflow   string
		components [2]int
	}{
		"no env deployed": {nil, apisv1.AppHealthUndeployed, "", [2]int{0, 0}},
		"running and healthy": {
			[]*apisv1.ApplicationStatusResponse{envStatus("dev", common.ApplicationRunning, "succeeded", true, true)},
			apisv1.AppHealthHealthy, "succeeded", [2]int{2, 2},
		},
		"a component unhealthy": {
			[]*apisv1.ApplicationStatusResponse{envStatus("dev", common.ApplicationRunning, "succeeded", true, false)},
			apisv1.AppHealthUnhealthy, "succeeded", [2]int{2, 1},
		},
		"the worst env sets the health": {
			[]*apisv1.ApplicationStatusResponse{
				envStatus("dev", common.ApplicationRunning, "succeeded", true),
				envStatus("prod", common.ApplicationWorkflowFailed, "failed", false),
			},
			apisv1.AppHealthFailed, "failed", [2]int{2, 1},
		},
		"a workflow still running": {
			[]*apisv1.ApplicationStatusResponse{envStatus("dev", common.ApplicationRunningWorkflow, "executing", false)},
			apisv1.AppHealthProgressing, "executing", [2]int{1, 0},
		},
		"a workflow suspended": {
			[]*apisv1.ApplicationStatusResponse{envStatus("dev", common.ApplicationWorkflowSuspending, "suspending", true)},
			apisv1.AppHealthSuspended, "suspending", [2]int{1, 1},
		},
	}
	for name, c := range cases {
		t.Run(name, func(t *testing.T) {
			s := SummariseAppStatus(c.envs)
			assert.Equal(t, c.health, s.Health)
			assert.Equal(t, c.workflow, s.Workflow)
			assert.Equal(t, c.components, [2]int{s.Components, s.HealthyComponents})
			assert.Len(t, s.Envs, len(c.envs))
		})
	}
}
