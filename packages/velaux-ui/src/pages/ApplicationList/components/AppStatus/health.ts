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
