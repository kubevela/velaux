import { post, get } from './request';
import { application_dev } from './devLink';
import { application } from './productionLink';
import { getDomain } from '../utils/common';
const baseURLOject = getDomain();
export function getApplicationList(params: any) {
  const url = baseURLOject.MOCK ? application_dev : application;
  return get(url, { params: params }).then((res) => res);
}

export function createApplicationList(params: any) {
  const url = baseURLOject.MOCK ? application_dev : application;
  return post(url, params).then((res) => res);
}

export function getApplicationDetails(params: any) {
  const realURL = `${application}/${params.name}`;
  const url = baseURLOject.MOCK ? application_dev : realURL;
  return get(url, params).then((res) => res);
}

export function getTopology(params: any) {
  const realURL = `${application}/${params.name}/components`;
  const url = baseURLOject.MOCK ? application_dev : realURL;
  return get(url, params).then((res) => res);
}

export function createApplicationComponent(params: any) {
  const realURL = `${application}/${params.name}/components`;
  const url = baseURLOject.MOCK ? application_dev : realURL;
  return post(url, params).then((res) => res);
}

export function getComponentDetails(params: any) {
  const realURL = `${application}/${params.name}/components/${params.componentName}`;
  const url = baseURLOject.MOCK ? application_dev : realURL;
  return post(url, params).then((res) => res);
}

export function updateApplication(params: any) {
  const realURL = `${application}/${params.name}/deploy`;
  const url = baseURLOject.MOCK ? application_dev : realURL;
  return post(url, params).then((res) => res);
}

export function getPolicyList(params: any) {
  const realURL = `${application}/${params.name}/policies`;
  const url = baseURLOject.MOCK ? application_dev : realURL;
  return get(url, params).then((res) => res);
}

export function createPolicy(params: any) {
  const realURL = `${application}/${params.name}/policies`;
  const url = baseURLOject.MOCK ? application_dev : realURL;
  return post(url, params).then((res) => res);
}

export function getPolicyDetails(params: any) {
  const realURL = `${application}/${params.name}/policies/${params.policyName}`;
  const url = baseURLOject.MOCK ? application_dev : realURL;
  return get(url, params).then((res) => res);
}

export function createApplicationTemplate(params: any) {
  const realURL = `${application}/${params.name}/template`;
  const url = baseURLOject.MOCK ? application_dev : realURL;
  return post(url, params).then((res) => res);
}
