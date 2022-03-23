import { post, get, rdelete, put } from './request';
import { Project } from '../interface/project';
import { project_mock } from './devLink';
import { project } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? project_mock : project;

export function getProjectList(params: any) {
  return get(url, params).then((res) => res);
}

export function createProject(params: Project) {
  return post(url, params).then((res) => res);
}

export function updateProject(params: Project) {
  const urlPath = project + `/${params.name}`;
  return put(urlPath, params).then((res) => res);
}

export function deleteProject(params: { name: string }) {
  const urlPath = project + `/${params.name}`;
  return rdelete(urlPath, {}).then((res) => res);
}

export function getProjectDetail(params: { projectsName: string }) {
  const urlPath = project + `/${params.projectsName}`;
  return get(urlPath, {}).then((res) => res);
}

export function getProjectDetailTargets(params: { projectsName: string }) {
  const urlPath = project + `/${params.projectsName}/targets`;
  return get(urlPath, {}).then((res) => res);
}
