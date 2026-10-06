import type { UpdateWorkflowRequest } from '@velaux/data';
import { getDomain } from '../utils/common';

import { application, definition } from './productionLink';
import { get, rdelete, put, post } from './request';

const baseURLOject = getDomain();
const base = baseURLOject.APIBASE;

export function listWorkflow(params: { appName: string }) {
  const url = base + `${application}/${params.appName}/workflows`;
  return get(url, {}).then((res) => res);
}

export function updateWorkflow(pathParams: { appName: string; workflowName: string }, params: UpdateWorkflowRequest) {
  const url = base + `${application}/${pathParams.appName}/workflows/${pathParams.workflowName}`;
  return put(url, params).then((res) => res);
}

// listSharedWorkflows lists the shared Workflows the workflow can reference.
export function listSharedWorkflows(params: { appName: string; workflowName: string }) {
  const url = base + `${application}/${params.appName}/workflows/${params.workflowName}/shared`;
  return get(url, {}).then((res) => res);
}

export function createWorkflow(pathParams: { appName: string }, params: UpdateWorkflowRequest) {
  const url = base + `${application}/${pathParams.appName}/workflows`;
  return post(url, params).then((res) => res);
}

export function getEnvWorkflowRecord(params: { appName: string; workflowName: string }) {
  const url = base + `${application}/${params.appName}/workflows/${params.workflowName}/records`;
  return get(url, params).then((res) => res);
}

export function detailWorkflow(params: { appName: string; name: string }) {
  const url = base + `${application}/${params.appName}/workflows/${params.name}`;
  return get(url, {});
}

export function detailWorkflowRecord(params: { appName: string; workflowName: string; record: string }) {
  const url = base + `${application}/${params.appName}/workflows/${params.workflowName}/records/${params.record}`;
  return get(url, {});
}

export function getWorkflowRecordLogs(params: { appName: string; workflowName: string; record: string; step: string }) {
  const url = base + `${application}/${params.appName}/workflows/${params.workflowName}/records/${params.record}/logs`;
  return get(url, { params: { step: params.step } });
}

export function getWorkflowRecordInputs(params: {
  appName: string;
  workflowName: string;
  record: string;
  step: string;
}) {
  const url =
    base + `${application}/${params.appName}/workflows/${params.workflowName}/records/${params.record}/inputs`;
  return get(url, { params: { step: params.step } });
}

export function getWorkflowRecordOutputs(params: {
  appName: string;
  workflowName: string;
  record: string;
  step: string;
}) {
  const url =
    base + `${application}/${params.appName}/workflows/${params.workflowName}/records/${params.record}/outputs`;
  return get(url, { params: { step: params.step } });
}

export function deleteWorkflow(params: { appName: string; name: string }) {
  const url = base + `${application}/${params.appName}/workflows/${params.name}`;
  return rdelete(url, {});
}

// namespaces, when given, have each definition report in unusableIn those its
// restrictions keep from using it.
export function getWorkflowDefinitions(scope?: 'Application' | 'WorkflowRun', namespaces?: string[]) {
  const url = base + `${definition}`;
  return get(url, { params: { type: 'workflowstep', scope: scope, namespaces: namespaces?.join(',') } }).then(
    (res) => res
  );
}

export function detailWorkflowDefinition(params: { name: string }) {
  const url = base + `${definition}/${params.name}`;
  return get(url, { params: { type: 'workflowstep' } }).then((res) => res);
}
