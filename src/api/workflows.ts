import { post, get } from './request';
import {
  workflows_mock,
  getWorkFlowsDetails_mock,
  createWorkFlow_mock,
  getWorkFlowsRecord_mock,
} from './devLink';
import { workflows } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? workflows_mock : workflows;

export function getWorkFlowsDetails(params: any) {
  const url = isMock ? `${getWorkFlowsDetails_mock}` : `${workflows}/${params.name}`;
  return get(url, params).then((res) => res);
}

export function createWorkFlow(params: any) {
  const url = isMock ? `${createWorkFlow_mock}` : `${workflows}/${params.name}`;
  return post(url, params).then((res) => res);
}

export function getWorkFlowsRecord(params: any) {
  const url = isMock ? `${getWorkFlowsRecord_mock}` : `${workflows}/${params.name}/records`;
  return get(url, params).then((res) => res);
}
