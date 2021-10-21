import { post, get } from './request';
import { workflows_dev } from './devLink';
import { workflows } from './productionLink';
import { getDomain } from '../utils/common';
const baseURLOject = getDomain();

export function getWorkFlowsDetails(params: any) {
  const realURL = `${workflows}/${params.name}`;
  const url = baseURLOject.MOCK ? workflows_dev : realURL;
  return get(url, params).then((res) => res);
}

export function createWorkFlow(params: any) {
  const realURL = `${workflows}/${params.name}`;
  const url = baseURLOject.MOCK ? workflows_dev : realURL;
  return post(url, params).then((res) => res);
}

export function getWorkFlowsRecord(params: any) {
  const realURL = `${workflows}/${params.name}/records`;
  const url = baseURLOject.MOCK ? workflows_dev : realURL;
  return get(url, params).then((res) => res);
}
