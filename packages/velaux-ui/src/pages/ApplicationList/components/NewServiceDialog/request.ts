// NewServiceValues are the New Service form's fields.
export interface NewServiceValues {
  name: string;
  alias?: string;
  description?: string;
  project: string;
  envs?: string[];
  expressions?: boolean;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  paused?: boolean;
  resyncInterval?: string;
  workflowMode?: 'StepByStep' | 'DAG';
}

// The metadata the controller reads from an Application: the pause label, and
// the expressions opt-in and resync interval annotations. They reach the
// Application on its first deploy, with the rest of its metadata.
export const pauseLabel = 'controller.core.oam.dev/pause';
export const expressionsAnnotation = 'app.oam.dev/cel-expressions';
export const resyncAnnotation = 'app.oam.dev/reconcile-interval';

// newServiceRequest is the create-application request for the form's values:
// an application with no component, bound to the chosen environments.
export function newServiceRequest(v: NewServiceValues) {
  const labels: Record<string, string> = { ...(v.labels || {}) };
  const annotations: Record<string, string> = { ...(v.annotations || {}) };
  if (v.paused) {
    labels[pauseLabel] = 'true';
  }
  if (v.expressions) {
    annotations[expressionsAnnotation] = 'true';
  }
  if (v.resyncInterval && v.resyncInterval.trim()) {
    annotations[resyncAnnotation] = v.resyncInterval.trim();
  }
  return {
    name: v.name,
    alias: v.alias || undefined,
    description: v.description || undefined,
    project: v.project,
    labels: Object.keys(labels).length > 0 ? labels : undefined,
    annotations: Object.keys(annotations).length > 0 ? annotations : undefined,
    envBinding: (v.envs || []).map((name) => ({ name })),
    workflowMode: v.workflowMode && v.workflowMode !== 'StepByStep' ? v.workflowMode : undefined,
  };
}

// defaultEnvs is the environments a new service is bound to before anyone
// chooses: the project's only one, when it has just one, and what was chosen
// otherwise.
export function defaultEnvs(available: string[], chosen: string[]): string[] {
  if (chosen.length > 0 || available.length !== 1) {
    return chosen;
  }
  return available;
}
