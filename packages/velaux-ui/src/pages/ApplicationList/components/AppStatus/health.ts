import type { AppHealth, ApplicationStatusSummary } from '@velaux/data';

// healthLabels names each health as the list shows it.
export const healthLabels: Record<AppHealth, string> = {
  failed: 'Failed',
  unhealthy: 'Unhealthy',
  suspended: 'Suspended',
  progressing: 'Progressing',
  healthy: 'Healthy',
  undeployed: 'Not deployed',
};

// healthOf is an application's health; one listed without a status is shown
// as not deployed.
export function healthOf(status?: ApplicationStatusSummary): AppHealth {
  return status?.health || 'undeployed';
}

// componentRatio is the share of components healthy, 0 to 1, or undefined
// when nothing is deployed.
export function componentRatio(status?: ApplicationStatusSummary): number | undefined {
  if (!status || !status.components) {
    return undefined;
  }
  return status.healthyComponents / status.components;
}

// workflowLabel writes a workflow phase as a word: "executing" to "Executing".
export function workflowLabel(phase?: string): string {
  if (!phase) {
    return '';
  }
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

// EnvironmentStatus is an application's status in one env, as the all-status API
// returns it.
export interface EnvironmentStatus {
  envName: string;
  status?: {
    status?: string;
    workflow?: { status?: string };
    services?: Array<{ healthy?: boolean }>;
    paused?: boolean;
  };
}

// pausedEnvs are the envs whose Application the controller is skipping.
export function pausedEnvs(statuses: EnvironmentStatus[]): string[] {
  return (statuses || []).filter((s) => s.status?.paused).map((s) => s.envName);
}

const healthRank: Record<AppHealth, number> = {
  undeployed: 0,
  healthy: 1,
  progressing: 2,
  suspended: 3,
  unhealthy: 4,
  failed: 5,
};

function environmentHealth(phase: string | undefined, components: number, healthy: number): AppHealth {
  switch (phase) {
    case 'workflowFailed':
    case 'workflowTerminated':
      return 'failed';
    case 'workflowSuspending':
      return 'suspended';
    case 'unhealthy':
      return 'unhealthy';
    case 'running':
      return healthy < components ? 'unhealthy' : 'healthy';
    default:
      return 'progressing';
  }
}

// summariseStatuses is an application's health across its envs: the worst
// env's, with components counted across all of them. It follows the server's
// summary on the application list.
export function summariseStatuses(statuses: EnvironmentStatus[]): ApplicationStatusSummary {
  const summary: ApplicationStatusSummary = { health: 'undeployed', components: 0, healthyComponents: 0, envs: [] };
  (statuses || []).forEach(({ envName, status }) => {
    if (!status) {
      return;
    }
    const services = status.services || [];
    const healthyComponents = services.filter((s) => s.healthy).length;
    const env = {
      env: envName,
      phase: status.status || '',
      workflow: status.workflow?.status,
      components: services.length,
      healthyComponents,
      health: environmentHealth(status.status, services.length, healthyComponents),
    };
    summary.envs?.push(env);
    summary.components += env.components;
    summary.healthyComponents += healthyComponents;
    if (healthRank[env.health] > healthRank[summary.health]) {
      summary.health = env.health;
      summary.workflow = env.workflow;
    }
  });
  return summary;
}
