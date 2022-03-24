import { post, get, rdelete, put } from './request';
import { ProjectBaseCreate } from '../interface/project';
import { project_mock } from './devLink';
import { project } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? project_mock : project;

export function getProjectList(params: { page?: number; pageSize?: number }) {
  return get(url, { params: params }).then((res) => res);
}

export function createProject(params: ProjectBaseCreate) {
  return post(url, params).then((res) => res);
}

export function updateProject(params: ProjectBaseCreate) {
  const urlPath = project + `/${params.name}`;
  return put(urlPath, params).then((res) => res);
}

export function deleteProject(params: { name: string }) {
  const urlPath = project + `/${params.name}`;
  return rdelete(urlPath, {}).then((res) => res);
}

export function getProjectDetail(params: { projectName: string }) {
  const urlPath = project + `/${params.projectName}`;
  return get(urlPath, {}).then((res) => res);
}

export function getProjectTargetList(params: { projectName: string }) {
  const urlPath = project + `/${params.projectName}/targets`;
  return get(urlPath, {}).then((res) => res);
}
