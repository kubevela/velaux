import { post, get } from './request';
import {
  application_mock,
  getApplicationDetails_mock,
  getApplicationComponents_mock,
  createApplicationComponent_mock,
  getComponentDetails_mock,
  updateApplication_mock,
  getPolicyList_mock,
  createPolicy_mock,
  getPolicyDetails_mock,
  createApplicationTemplate_mock,
} from './devLink';
import { application } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? application_mock : application;

export function getApplicationList(params: any) {
  return get(url, { params: params }).then((res) => res);
}

export function createApplicationList(params: any) {
  return post(url, params).then((res) => res);
}

export function getApplicationDetails(params: any) {
  const url = isMock ? `${getApplicationDetails_mock}` : `${application}/${params.name}`;
  return get(url, params).then((res) => res);
}

export function getApplicationComponents(params: any) {
  const url = isMock
    ? `${getApplicationComponents_mock}`
    : `${application}/${params.name}/components`;
  return get(url, params).then((res) => res);
}

export function createApplicationComponent(params: any) {
  const url = isMock
    ? `${createApplicationComponent_mock}`
    : `${application}/${params.name}/components`;
  return post(url, params).then((res) => res);
}

export function getComponentDetails(params: any) {
  const url = isMock
    ? `${getComponentDetails_mock}`
    : `${application}/${params.name}/components/${params.componentName}`;
  return post(url, params).then((res) => res);
}

export function updateApplication(params: any) {
  const url = isMock ? `${updateApplication_mock}` : `${application}/${params.name}/deploy`;
  return post(url, params).then((res) => res);
}

export function getPolicyList(params: any) {
  const url = isMock ? `${getPolicyList_mock}` : `${application}/${params.name}/policies`;
  return get(url, params).then((res) => res);
}

export function createPolicy(params: any) {
  const url = isMock ? `${createPolicy_mock}` : `${application}/${params.name}/policies`;
  return post(url, params).then((res) => res);
}

export function getPolicyDetails(params: any) {
  const url = isMock
    ? `${getPolicyDetails_mock}`
    : `${application}/${params.name}/policies/${params.policyName}`;
  return get(url, params).then((res) => res);
}

export function createApplicationTemplate(params: any) {
  const url = isMock
    ? `${createApplicationTemplate_mock}`
    : `${application}/${params.name}/template`;
  return post(url, params).then((res) => res);
}
