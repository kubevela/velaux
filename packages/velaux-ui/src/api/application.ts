import type {
  ApplicationDeployRequest,
  Trait,
  ApplicationComponentConfig,
  ApplicationQuery,
  ApplicationCompareRequest,
  ApplicationDryRunRequest,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  UpdateTriggerRequest,
  CreateTriggerRequest,
} from '@velaux/data';
import { getDomain } from '../utils/common';

import { application } from './productionLink';
import { post, get, rdelete, put } from './request';

interface TraitQuery {
  appName: string;
  componentName?: string;
  traitType?: string;
}

interface ListRevisionQuery {
  appName?: string;
  envName?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

const baseURLOject = getDomain();
const url = baseURLOject.APIBASE + application;

export function getApplicationList(params: ApplicationQuery) {
  return get(url, { params: params }).then((res) => res);
}

export function createApplication(params: any) {
  const createURL = `${url}?project=${params.project}`;
  return post(createURL, params).then((res) => res);
}

export function getApplicationDetails(params: any) {
  return get(`${url}/${params.name}`, params).then((res) => res);
}

export function getApplicationStatus(params: { name: string; envName: string }) {
  return get(`${url}/${params.name}/envs/${params.envName}/status`, params).then((res) => res);
}
export function getApplicationAllStatus(params: { name: string }) {
  return get(`${url}/${params.name}/status`, params).then((res) => res);
}

export function deleteApplication(params: { name: string }) {
  return rdelete(url + '/' + params.name, params);
}

export function getApplicationComponents(params: { appName: string }) {
  const { appName } = params;
  return get(`${url}/${appName}/components`, {}).then((res) => res);
}

export function createApplicationComponent(params: ApplicationComponentConfig, query: { appName: string }) {
  return post(`${url}/${query.appName}/components`, params).then((res) => res);
}

export function getComponentDetails(params: any) {
  return post(`${url}/${params.name}/components/${params.componentName}`, params).then((res) => res);
}

export function deployApplication(params: ApplicationDeployRequest, customError?: boolean) {
  return post(`${url}/${params.appName}/deploy`, params, customError);
}

export function getPolicyList(params: { appName: string }) {
  return get(`${url}/${params.appName}/policies`, params).then((res) => res);
}

export function createPolicy(appName: string, params: CreatePolicyRequest) {
  return post(`${url}/${appName}/policies`, params).then((res) => res);
}

export function updatePolicy(appName: string, policyName: string, params: UpdatePolicyRequest) {
  return put(`${url}/${appName}/policies/${policyName}`, params).then((res) => res);
}

export function getPolicyDetail(params: { appName: string; policyName: string }) {
  return get(`${url}/${params.appName}/policies/${params.policyName}`, params).then((res) => res);
}

export function deletePolicy(params: { appName: string; policyName: string; force?: boolean }) {
  const gURL = `${url}/${params.appName}/policies/${params.policyName}`;
  if (params.force) {
    return rdelete(gURL, { params: { force: true } }, true).then((res) => res);
  }
  return rdelete(gURL, {}, true).then((res) => res);
}

export function createApplicationTemplate(params: any) {
  return post(`${url}/${params.name}/template`, params).then((res) => res);
}

export function createApplicationEnvbinding(params: { appName?: string }) {
  return post(`${url}/${params.appName}/envs`, params).then((res) => res);
}

export function updateApplicationEnvbinding(params: { appName?: string; name: string }) {
  return put(`${url}/${params.appName}/envs/${params.name}`, params).then((res) => res);
}

export function getApplicationEnvbinding(params: { appName: string }) {
  return get(`${url}/${params.appName}/envs`, params).then((res) => res);
}

export function deleteApplicationEnvbinding(params: { appName: string; envName: string }) {
  return rdelete(`${url}/${params.appName}/envs/${params.envName}`, {}).then((res) => res);
}

export function recycleApplicationEnvbinding(params: { appName: string; envName: string }) {
  return post(`${url}/${params.appName}/envs/${params.envName}/recycle`, {}).then((res) => res);
}

export function getApplicationComponent(appName: string, componentName: string) {
  return get(`${url}/${appName}/components/${componentName}`, {}).then((res) => res);
}

export function createTrait(params: Trait, query: TraitQuery) {
  const { appName, componentName } = query;
  return post(`${url}/${appName}/components/${componentName}/traits`, params).then((res) => res);
}

export function updateTrait(params: Trait, query: TraitQuery) {
  const { appName, componentName, traitType } = query;
  return put(`${url}/${appName}/components/${componentName}/traits/${traitType}`, params).then((res) => res);
}

export function deleteTrait(query: TraitQuery) {
  const { appName, componentName, traitType } = query;
  return rdelete(`${url}/${appName}/components/${componentName}/traits/${traitType}`, {}).then((res) => res);
}

export function listRevisions(query: ListRevisionQuery) {
  const { appName } = query;
  return get(`${url}/${appName}/revisions`, { params: query }).then((res) => res);
}

export function detailRevision(query: { appName: string; revision: string }) {
  const { appName, revision } = query;
  return get(`${url}/${appName}/revisions/${revision}`, {}).then((res) => res);
}

export function rollbackWithRevision(query: { appName: string; revision: string }) {
  const { appName, revision } = query;
  return post(`${url}/${appName}/revisions/${revision}/rollback`, {}).then((res) => res);
}

export function getApplicationStatistics(params: { appName: string }) {
  return get(`${url}/${params.appName}/statistics`, params).then((res) => res);
}

export function getApplicationWorkflowRecord(params: { appName: string }) {
  return get(`${url}/${params.appName}/records`, params).then((res) => res);
}

export function getApplicationEnvRecords(params: {
  appName: string;
  envName: string;
  pageSize?: number;
  page?: number;
}) {
  return get(`${url}/${params.appName}/envs/${params.envName}/records`, {
    params: {
      pageSize: params.pageSize || 20,
      page: params.page || 1,
    },
  }).then((res) => res);
}

export function updateComponentProperties(
  params: ApplicationComponentConfig,
  query: { appName: string; componentName: string }
) {
  return put(`${url}/${query.appName}/components/${query.componentName}`, params).then((res) => res);
}

export function resumeApplicationWorkflowRecord(params: { appName: string; workflowName: string; recordName: string }) {
  const { appName, workflowName, recordName } = params;
  return get(`${url}/${appName}/workflows/${workflowName}/records/${recordName}/resume`, {}).then((res) => res);
}

export function rollbackApplicationWorkflowRecord(params: {
  appName: string;
  workflowName: string;
  recordName: string;
}) {
  const { appName, workflowName, recordName } = params;
  return get(`${url}/${appName}/workflows/${workflowName}/records/${recordName}/rollback`, {}).then((res) => res);
}

export function terminateApplicationWorkflowRecord(params: {
  appName: string;
  workflowName: string;
  recordName: string;
}) {
  const { appName, workflowName, recordName } = params;
  return get(`${url}/${appName}/workflows/${workflowName}/records/${recordName}/terminate`, {}).then((res) => res);
}

export function getApplicationTriggers(params: { appName: string }) {
  const { appName } = params;
  return get(`${url}/${appName}/triggers`, {}).then((res) => res);
}

export function updateApplication(params: any) {
  return put(`${url}/${params.name}`, params).then((res) => res);
}

export function createTrigger(params: CreateTriggerRequest, query: { appName: string }) {
  const { appName } = query;
  return post(`${url}/${appName}/triggers`, params).then((res) => res);
}

export function updateTrigger(params: UpdateTriggerRequest, query: { appName: string; token: string }) {
  const { appName, token } = query;
  return put(`${url}/${appName}/triggers/${token}`, params).then((res) => res);
}

export function deleteTrigger(params: { appName: string; token: string }) {
  const { appName, token } = params;
  return rdelete(`${url}/${appName}/triggers/${token}`, {}).then((res) => res);
}

export function deleteComponent(query: { appName: string; componentName: string }) {
  return rdelete(`${url}/${query.appName}/components/${query.componentName}`, {}).then((res) => res);
}

export function compareApplication(appName: string, params: ApplicationCompareRequest) {
  const _url = `${url}/${appName}/compare`;
  return post(_url, params).then((res) => res);
}

export function dryRunApplication(appName: string, params: ApplicationDryRunRequest) {
  return post(`${url}/${appName}/dry-run`, params, true).then((res) => res);
}
