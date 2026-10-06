import type { LoginUserInfo, SharedWorkflowScope, WorkflowMode, WorkflowStep } from '@velaux/data';

import { checkPermission } from '../../utils/permission';

// SharedWorkflowDraft is a shared workflow the studio opens before it exists:
// new, or a copy of another. Saving creates it.
export type SharedWorkflowDraft = {
  project: string;
  scope: 'project' | 'global';
  // namespace is where it will live, for the step types it may use.
  namespace?: string;
  name: string;
  alias?: string;
  description?: string;
  mode?: WorkflowMode;
  subMode?: WorkflowMode;
  steps: WorkflowStep[];
};

// studioPath is the studio for a shared workflow, in the project whose
// applications it is shown for.
export const studioPath = (project: string, scope: SharedWorkflowScope, name: string) =>
  `/shared-workflows/${scope}/${name}?project=${encodeURIComponent(project)}`;

// The permissions behind each scope: the project's workflow permission, or,
// for global ones, the platform's sharedWorkflow permission, held by admins.
const resource = (project: string, scope: SharedWorkflowScope) =>
  scope === 'global' ? 'sharedWorkflow:*' : `project:${project}/workflow:*`;

export const canCreate = (project: string, scope: SharedWorkflowScope, userInfo?: LoginUserInfo) =>
  checkPermission({ resource: resource(project, scope), action: 'create' }, project, userInfo);

export const canChange = (project: string, scope: SharedWorkflowScope, userInfo?: LoginUserInfo) =>
  scope !== 'environment' &&
  checkPermission({ resource: resource(project, scope), action: 'update' }, project, userInfo);
