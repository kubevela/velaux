import { post, get } from './request';
import { application_dev } from './devLink';
import { application } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
let url = isMock ? application_dev : application;

export function getApplicationList(params: any) {
  return get(url, { params: params }).then((res) => res);
}

export function createApplicationList(params: any) {
  return post(url, params).then((res) => res);
}

export function getApplicationDetails(params: any) {
  if (!isMock) {
    url = `${application}/${params.name}`;
  }
  return get(url, params).then((res) => res);
}

export function getApplicationComponents(params: any) {
  if (!isMock) {
    url = `${application}/${params.name}/components`;
  }
  return get(url, params).then((res) => res);
}

export function createApplicationComponent(params: any) {
  if (!isMock) {
    url = `${application}/${params.name}/components`;
  }
  return post(url, params).then((res) => res);
}

export function getComponentDetails(params: any) {
  if (!isMock) {
    url = `${application}/${params.name}/components/${params.componentName}`;
  }
  return post(url, params).then((res) => res);
}

export function updateApplication(params: any) {
  if (!isMock) {
    url = `${application}/${params.name}/deploy`;
  }
  return post(url, params).then((res) => res);
}

export function getPolicyList(params: any) {
  if (!isMock) {
    url = `${application}/${params.name}/policies`;
  }
  return get(url, params).then((res) => res);
}

export function createPolicy(params: any) {
  if (!isMock) {
    url = `${application}/${params.name}/policies`;
  }
  return post(url, params).then((res) => res);
}

export function getPolicyDetails(params: any) {
  if (!isMock) {
    url = `${application}/${params.name}/policies/${params.policyName}`;
  }
  return get(url, params).then((res) => res);
}

export function createApplicationTemplate(params: any) {
  if (!isMock) {
    url = `${application}/${params.name}/template`;
  }
  return post(url, params).then((res) => res);
}
