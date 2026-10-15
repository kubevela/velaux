import type { SharedWorkflowRequest } from '@velaux/data';
import { getDomain } from '../utils/common';

import { get, post, put, rdelete } from './request';

const base = getDomain().APIBASE + '/api/v1/shared-workflows';

// listSharedWorkflows lists the project's shared workflows, then the global ones.
export function listSharedWorkflows(project: string) {
  return get(base, { params: { project } });
}

export function detailSharedWorkflow(project: string, scope: string, name: string) {
  return get(`${base}/${scope}/${name}`, { params: { project } });
}

// createSharedWorkflow creates one in the project's namespace, or a global one.
export function createSharedWorkflow(project: string, scope: string, body: SharedWorkflowRequest) {
  return post(scope === 'global' ? `${base}/global` : `${base}/project?project=${project}`, body);
}

export function updateSharedWorkflow(project: string, scope: string, name: string, body: SharedWorkflowRequest) {
  return put(scope === 'global' ? `${base}/global/${name}` : `${base}/project/${name}?project=${project}`, body);
}

export function deleteSharedWorkflow(project: string, scope: string, name: string) {
  return rdelete(scope === 'global' ? `${base}/global/${name}` : `${base}/project/${name}?project=${project}`, {});
}
