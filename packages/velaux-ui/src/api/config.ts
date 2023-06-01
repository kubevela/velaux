import type {
  CreateConfigDistribution,
  CreateConfigRequest,
  NamespacedName,
  UpdateConfigRequest,
 ProjectName } from '@velaux/data';
import { getDomain } from '../utils/common';

import { configs, configTemplates, project } from './productionLink';
import { get, post, put, rdelete } from './request';

const baseURLOject = getDomain();
const base = baseURLOject.APIBASE;

export function listTemplates(projectName?: string) {
  let url = base + configTemplates;
  if (projectName) {
    url = base + project + '/' + projectName + '/config_templates';
  }
  return get(url, {}).then((res) => res);
}

export function detailTemplate(queryData: NamespacedName, projectName?: string) {
  let url = base + configTemplates + `/${queryData.name}`;
  if (projectName) {
    url = base + project + '/' + projectName + '/config_templates/' + queryData.name;
  }
  return get(url, {
    params: {
      namespace: queryData.namespace,
    },
  }).then((res) => res);
}

export function createConfig(data: CreateConfigRequest, projectName?: string) {
  let url = base + configs;
  if (projectName) {
    url = base + project + '/' + projectName + '/configs';
  }
  return post(url, data).then((res) => res);
}

export function updateConfig(name: string, data: UpdateConfigRequest, projectName?: string) {
  let url = base + configs + `/${name}`;
  if (projectName) {
    url = base + project + '/' + projectName + '/configs/' + name;
  }
  return put(url, data).then((res) => res);
}

export function getConfigs(template?: string) {
  const url = base + configs;
  return get(url, {
    params: { template: template ? template : '' },
  }).then((res) => res);
}

export function detailConfig(name: string, projectName?: string) {
  let url = base + configs + `/${name}`;
  if (projectName) {
    url = base + project + '/' + projectName + '/configs/' + name;
  }
  return get(url, {}).then((res) => res);
}

export function deleteConfig(name: string, projectName?: string) {
  let url = base + configs + `/${name}`;
  if (projectName) {
    url = base + project + '/' + projectName + '/configs/' + name;
  }
  return rdelete(url, {}).then((res) => res);
}

export function getProjectConfigs(query: ProjectName) {
  const urlPath = project + `/${query.projectName}/configs`;
  return get(urlPath, {}).then((res) => res);
}

export function getProjectConfigDistributions(query: ProjectName) {
  const urlPath = project + `/${query.projectName}/distributions`;
  return get(urlPath, {}).then((res) => res);
}

export function applyProjectConfigDistribution(
  projectName: string,
  params: CreateConfigDistribution,
) {
  const urlPath = project + `/${projectName}/distributions`;
  return post(urlPath, params).then((res) => res);
}

export function deleteProjectConfigDistribution(projectName: string, name: string) {
  const urlPath = project + `/${projectName}/distributions/${name}`;
  return rdelete(urlPath, {}).then((res) => res);
}
