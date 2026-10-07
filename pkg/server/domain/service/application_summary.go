package service

import (
	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

// healthRank orders the healths, worst highest.
var healthRank = map[string]int{
	apisv1.AppHealthHealthy:     1,
	apisv1.AppHealthProgressing: 2,
	apisv1.AppHealthSuspended:   3,
	apisv1.AppHealthUnhealthy:   4,
	apisv1.AppHealthFailed:      5,
}

// SummariseAppStatus is an application's health across its envs: the worst
// env's, with components counted across all of them.
func SummariseAppStatus(envs []*apisv1.ApplicationStatusResponse) *apisv1.ApplicationStatusSummary {
	summary := &apisv1.ApplicationStatusSummary{Health: apisv1.AppHealthUndeployed}
	worst := 0
	for _, env := range envs {
		if env == nil || env.Status == nil {
			continue
		}
		e := summariseEnv(env.EnvName, &env.Status.AppStatus)
		summary.Envs = append(summary.Envs, e)
		summary.Components += e.Components
		summary.HealthyComponents += e.HealthyComponents
		if healthRank[e.Health] > worst {
			worst = healthRank[e.Health]
			summary.Health = e.Health
			summary.Workflow = e.Workflow
		}
	}
	return summary
}

func summariseEnv(name string, status *common.AppStatus) *apisv1.EnvStatusSummary {
	e := &apisv1.EnvStatusSummary{Env: name, Phase: string(status.Phase)}
	if status.Workflow != nil {
		e.Workflow = string(status.Workflow.Phase)
	}
	for _, svc := range status.Services {
		e.Components++
		if svc.Healthy {
			e.HealthyComponents++
		}
	}
	switch status.Phase {
	case common.ApplicationWorkflowFailed, common.ApplicationWorkflowTerminated:
		e.Health = apisv1.AppHealthFailed
	case common.ApplicationWorkflowSuspending:
		e.Health = apisv1.AppHealthSuspended
	case common.ApplicationUnhealthy:
		e.Health = apisv1.AppHealthUnhealthy
	case common.ApplicationRunning:
		e.Health = apisv1.AppHealthHealthy
		if e.HealthyComponents < e.Components {
			e.Health = apisv1.AppHealthUnhealthy
		}
	default:
		e.Health = apisv1.AppHealthProgressing
	}
	return e
}
