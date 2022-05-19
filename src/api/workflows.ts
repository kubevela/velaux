import { post, get, rdelete, put } from './request';
import {
  workflows_mock,
  getWorkFlowsDetails_mock,
  getWorkFlowsRecord_mock,
  listWorkflowDefinition_mock,
  listWorkflowDetailsDefinition_mock,
} from './devLink';
import { workflows, definition } from './productionLink';
import { getDomain } from '../utils/common';
import type { WorkFlowData } from '../pages/ApplicationWorkflow/entity';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;

export function listWorkFlow(params: { appName: string }) {
  const url = isMock ? `${workflows_mock}` : `${workflows}/${params.appName}/workflows`;
  return get(url, {}).then((res) => res);
}

export function createWorkFlow(params: WorkFlowData) {
  const url = isMock ? `${workflows_mock}` : `${workflows}/${params.appName}/workflows`;
  return post(url, params).then((res) => res);
}

export function updateWorkFlow(params: WorkFlowData) {
  const url = isMock ? `${workflows_mock}` : `${workflows}/${params.appName}/workflows`;
  return put(url, params).then((res) => res);
}

export function getWorkFlowsRecord(params: { name: string }) {
  const url = isMock ? `${getWorkFlowsRecord_mock}` : `${workflows}/${params.name}/records`;
  return get(url, params).then((res) => res);
}

export function deleteWorkFlow(params: { appName: string; name: string }) {
  const url = isMock
    ? `${getWorkFlowsDetails_mock}`
    : `${workflows}/${params.appName}/workflows/${params.name}`;
  return rdelete(url, {});
}

export function getWorkFlowDefinitions() {
  const url = isMock ? `${listWorkflowDefinition_mock}` : `${definition}`;
  return get(url, { params: { type: 'workflowstep' } }).then((res) => res);
}

export function detailWorkFLowDefinition(params: { name: string }) {
  const url = isMock ? `${listWorkflowDetailsDefinition_mock}` : `${definition}/${params.name}`;
  return get(url, { params: { type: 'workflowstep' } }).then((res) => res);
}
