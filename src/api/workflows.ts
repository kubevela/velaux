import { post, get, rdelete, put } from './request';
import {
  workflows_mock,
  getWorkFlowsDetails_mock,
  createWorkFlow_mock,
  getWorkFlowsRecord_mock,
  listWorkFlowDefintion_mock,
  listWorkFlowDetailsDefintion_mock,
} from './devLink';
import { workflows, componentdefinition } from './productionLink';
import { getDomain } from '../utils/common';
import { WorkFlowData } from '../pages/ApplicationWorkflow/entity';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? workflows_mock : workflows;

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
  const url = isMock ? `${listWorkFlowDefintion_mock}` : `${componentdefinition}`;
  return get(url, { params: { type: 'workflowstep' } }).then((res) => res);
}

export function detailWorkFLowDefinition(params: { name: string }) {
  const url = isMock
    ? `${listWorkFlowDetailsDefintion_mock}`
    : `${componentdefinition}/${params.name}`;
  return get(url, { params: { type: 'workflowstep' } }).then((res) => res);
}
