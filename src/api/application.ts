import { post, get, rdelete, put } from './request';
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
  createApplicationEnv_mock,
  getTraitDefinitionsDetails_mock,
  getTraitDefinitions_mock,
  getTrait_mock,
  updateApplicationEnv_mock,
} from './devLink';
import { application, definition } from './productionLink';
import { getDomain } from '../utils/common';
import type {
  ApplicationDeployRequest,
  Trait,
  Trigger,
  ApplicationComponentConfig,
  ApplicationQuery,
  ApplicationCompareRequest,
  ApplicationDryRunRequest,
  CreatePolicyRequest,
} from '../interface/application';

interface TraitQuery {
  appName: string;
  componentName?: string;
  traitType?: string;
}

interface listRevisionsQuery {
  appName?: string;
  envName?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? application_mock : application;

export function getApplicationList(params: ApplicationQuery) {
  return get(url, { params: params }).then((res) => res);
}

export function createApplication(params: any) {
  const createURL = `${url}?project=${params.project}`;
  return post(createURL, params).then((res) => res);
}

export function getApplicationDetails(params: any) {
  const gurl = isMock ? `${getApplicationDetails_mock}` : `${application}/${params.name}`;
  return get(gurl, params).then((res) => res);
}

export function getApplicationStatus(params: { name: string; envName: string }) {
  const gurl = isMock
    ? `${getApplicationDetails_mock}`
    : `${application}/${params.name}/envs/${params.envName}/status`;
  return get(gurl, params).then((res) => res);
}

export function deleteApplicationPlan(params: { name: string }) {
  return rdelete(url + '/' + params.name, params);
}

export function getApplicationComponents(params: { appName: string }) {
  const { appName } = params;
  const gurl = isMock ? `${getApplicationComponents_mock}` : `${application}/${appName}/components`;
  return get(gurl, {}).then((res) => res);
}

export function createApplicationComponent(
  params: ApplicationComponentConfig,
  query: { appName: string },
) {
  const gurl = isMock
    ? `${createApplicationComponent_mock}`
    : `${application}/${query.appName}/components`;
  return post(gurl, params).then((res) => res);
}

export function getComponentDetails(params: any) {
  const gurl = isMock
    ? `${getComponentDetails_mock}`
    : `${application}/${params.name}/components/${params.componentName}`;
  return post(gurl, params).then((res) => res);
}

export function deployApplication(params: ApplicationDeployRequest, customError?: boolean) {
  const gurl = isMock ? `${updateApplication_mock}` : `${application}/${params.appName}/deploy`;
  return post(gurl, params, customError);
}

export function getPolicyList(params: { appName: string }) {
  const gurl = isMock ? `${getPolicyList_mock}` : `${application}/${params.appName}/policies`;
  return get(gurl, params).then((res) => res);
}

export function createPolicy(appName: string, params: CreatePolicyRequest) {
  const gurl = isMock ? `${createPolicy_mock}` : `${application}/${appName}/policies`;
  return post(gurl, params).then((res) => res);
}

export function getPolicyDetail(params: { appName: string; policyName: string }) {
  const gurl = isMock
    ? `${getPolicyDetails_mock}`
    : `${application}/${params.appName}/policies/${params.policyName}`;
  return get(gurl, params).then((res) => res);
}

export function deletePolicy(params: { appName: string; policyName: string; force?: boolean }) {
  const gurl = `${application}/${params.appName}/policies/${params.policyName}`;
  if (params.force) {
    return rdelete(gurl, { params: { force: true } }, true).then((res) => res);
  }
  return rdelete(gurl, {}, true).then((res) => res);
}

export function createApplicationTemplate(params: any) {
  const gurl = isMock
    ? `${createApplicationTemplate_mock}`
    : `${application}/${params.name}/template`;
  return post(gurl, params).then((res) => res);
}

export function getComponentDefinitions() {
  const gurl = isMock ? `${getPolicyDetails_mock}` : `${definition}`;
  return get(gurl, { params: { type: 'component' } }).then((res) => res);
}

export function detailComponentDefinition(params: { name: string }) {
  const gurl = isMock ? `${getPolicyDetails_mock}` : `${definition}/${params.name}`;
  return get(gurl, { params: { type: 'component' } }).then((res) => res);
}

export function getPolicyDefinitions() {
  const gurl = isMock ? `${getPolicyDetails_mock}` : `${definition}`;
  return get(gurl, { params: { type: 'policy' } }).then((res) => res);
}

export function detailPolicyDefinition(params: { name: string }) {
  const gurl = isMock ? `${getPolicyDetails_mock}` : `${definition}/${params.name}`;
  return get(gurl, { params: { type: 'policy' } }).then((res) => res);
}

export function createApplicationEnv(params: { appName?: string }) {
  const gurl = isMock ? `${createApplicationEnv_mock}` : `${application}/${params.appName}/envs`;
  delete params.appName;
  return post(gurl, params).then((res) => res);
}

export function updateApplicationEnv(params: { appName?: string; name: string }) {
  const gurl = isMock
    ? `${updateApplicationEnv_mock}`
    : `${application}/${params.appName}/envs/${params.name}`;
  return put(gurl, params).then((res) => res);
}

export function getApplicationEnvbinding(params: { appName: string }) {
  return get(`${application}/${params.appName}/envs`, params).then((res) => res);
}

export function deleteApplicationEnvbinding(params: { appName: string; envName: string }) {
  return rdelete(`${application}/${params.appName}/envs/${params.envName}`, {}).then((res) => res);
}

export function recycleApplicationEnvbinding(params: { appName: string; envName: string }) {
  return post(`${application}/${params.appName}/envs/${params.envName}/recycle`, {}).then(
    (res) => res,
  );
}

export function getTraitDefinitions(params: { appliedWorkload: string }) {
  const gurl = isMock ? `${getTraitDefinitions_mock}` : `${definition}`;
  return get(gurl, { params: { type: 'trait', appliedWorkload: params.appliedWorkload } }).then(
    (res) => res,
  );
}

export function detailTraitDefinition(params: { name: string }) {
  const gurl = isMock ? `${getTraitDefinitionsDetails_mock}` : `${definition}/${params.name}`;
  return get(gurl, { params: { type: 'trait' } }).then((res) => res);
}

export function getApplicationComponent(appName: string, componentName: string) {
  const gurl = isMock
    ? `${getTrait_mock}`
    : `${application}/${appName}/components/${componentName}`;
  return get(gurl, {}).then((res) => res);
}

export function createTrait(params: Trait, query: TraitQuery) {
  const { appName, componentName } = query;
  const gurl = isMock
    ? `${getTrait_mock}`
    : `${application}/${appName}/components/${componentName}/traits`;
  return post(gurl, params).then((res) => res);
}

export function updateTrait(params: Trait, query: TraitQuery) {
  const { appName, componentName, traitType } = query;
  const gurl = isMock
    ? `${getTrait_mock}`
    : `${application}/${appName}/components/${componentName}/traits/${traitType}`;
  return put(gurl, params).then((res) => res);
}

export function deleteTrait(query: TraitQuery) {
  const { appName, componentName, traitType } = query;
  const gurl = isMock
    ? `${getTrait_mock}`
    : `${application}/${appName}/components/${componentName}/traits/${traitType}`;
  return rdelete(gurl, {}).then((res) => res);
}

export function listRevisions(query: listRevisionsQuery) {
  const { appName } = query;
  const gurl = isMock ? `${getTrait_mock}` : `${application}/${appName}/revisions`;
  return get(gurl, { params: query }).then((res) => res);
}

export function detailRevision(query: { appName: string; revision: string }) {
  const { appName, revision } = query;
  const gurl = isMock ? `${getTrait_mock}` : `${application}/${appName}/revisions/${revision}`;
  return get(gurl, {}).then((res) => res);
}

export function getApplicationStatistics(params: { appName: string }) {
  return get(`${application}/${params.appName}/statistics`, params).then((res) => res);
}

export function getApplicationWorkflowRecord(params: { appName: string }) {
  return get(`${application}/${params.appName}/records`, params).then((res) => res);
}

export function updateComponentProperties(
  params: ApplicationComponentConfig,
  query: { appName: string; componentName: string },
) {
  const gurl = isMock
    ? `${getComponentDetails_mock}`
    : `${application}/${query.appName}/components/${query.componentName}`;
  return put(gurl, params).then((res) => res);
}

export function resumeApplicationWorkflowRecord(params: {
  appName: string;
  workflowName: string;
  recordName: string;
}) {
  const { appName, workflowName, recordName } = params;
  return get(
    `${application}/${appName}/workflows/${workflowName}/records/${recordName}/resume`,
    {},
  ).then((res) => res);
}

export function rollbackApplicationWorkflowRecord(params: {
  appName: string;
  workflowName: string;
  recordName: string;
}) {
  const { appName, workflowName, recordName } = params;
  return get(
    `${application}/${appName}/workflows/${workflowName}/records/${recordName}/rollback`,
    {},
  ).then((res) => res);
}

export function terminateApplicationWorkflowRecord(params: {
  appName: string;
  workflowName: string;
  recordName: string;
}) {
  const { appName, workflowName, recordName } = params;
  return get(
    `${application}/${appName}/workflows/${workflowName}/records/${recordName}/terminate`,
    {},
  ).then((res) => res);
}

export function getApplicationTriggers(params: { appName: string }) {
  const { appName } = params;
  const gurl = isMock ? `${getTrait_mock}` : `${application}/${appName}/triggers`;
  return get(gurl, {}).then((res) => res);
}

export function updateApplication(params: any) {
  const _url = isMock ? `${updateApplicationEnv_mock}` : `${application}/${params.name}`;
  return put(_url, params).then((res) => res);
}

export function createTriggers(params: Trigger, query: { appName: string }) {
  const { appName } = query;
  const gurl = isMock ? `${getTrait_mock}` : `${application}/${appName}/triggers`;
  return post(gurl, params).then((res) => res);
}

export function deleteTriggers(params: { appName: string; token: string }) {
  const { appName, token } = params;
  const gurl = isMock ? `${getTrait_mock}` : `${application}/${appName}/triggers/${token}`;
  return rdelete(gurl, {}).then((res) => res);
}

export function deleteComponent(query: { appName: string; componentName: string }) {
  const gurl = isMock
    ? `${getTrait_mock}`
    : `${application}/${query.appName}/components/${query.componentName}`;
  return rdelete(gurl, {}).then((res) => res);
}

export function compareApplication(appName: string, params: ApplicationCompareRequest) {
  const gurl = `${application}/${appName}/compare`;
  return post(gurl, params).then((res) => res);
}

export function dryRunApplication(appName: string, params: ApplicationDryRunRequest) {
  const gurl = `${application}/${appName}/dry-run`;
  return post(gurl, params, true).then((res) => res);
}
