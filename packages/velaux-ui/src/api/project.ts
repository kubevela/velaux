import type {
  ProjectBaseCreate,
  ProjectName,
  QueryProjectUser,
  UserRoles,
  QueryProjectRole,
  ProjectRole,
  ProjectUserCreate,
  ProjectUserQuery,
} from '@velaux/data';
import { getDomain } from '../utils/common';

import { project_mock } from './devLink';
import { project } from './productionLink';
import { post, get, rdelete, put } from './request';

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

export function getProjectPermissions(params: { projectName: string }) {
  const urlPath = project + `/${params.projectName}/permissions`;
  return get(urlPath, {}).then((res) => res);
}

export function getProjectRoles(query: ProjectName) {
  const urlPath = project + `/${query.projectName}/roles`;
  return get(urlPath, {}).then((res) => res);
}

export function createProjectRoles(query: ProjectName, params: ProjectRole) {
  const urlPath = project + `/${query.projectName}/roles`;
  return post(urlPath, params).then((res) => res);
}

export function updateProjectRoles(query: QueryProjectRole, params: ProjectRole) {
  const urlPath = project + `/${query.projectName}/roles/${query.roleName}`;
  return put(urlPath, params).then((res) => res);
}

export function deleteProjectRoles(query: QueryProjectRole) {
  const urlPath = project + `/${query.projectName}/roles/${query.roleName}`;
  return rdelete(urlPath, {}).then((res) => res);
}

export function getProjectUsers(query: ProjectUserQuery) {
  const urlPath = project + `/${query.projectName}/users`;
  return get(urlPath, { params: query }).then((res) => res);
}

export function createProjectUsers(query: ProjectName, params: ProjectUserCreate) {
  const urlPath = project + `/${query.projectName}/users`;
  return post(urlPath, params).then((res) => res);
}

export function updateProjectUser(query: QueryProjectUser, params: UserRoles) {
  const urlPath = project + `/${query.projectName}/users/${query.userName}`;
  return put(urlPath, params).then((res) => res);
}

export function deleteProjectUser(query: QueryProjectUser, params: UserRoles) {
  const urlPath = project + `/${query.projectName}/users/${query.userName}`;
  return rdelete(urlPath, params).then((res) => res);
}
export function getCloudServiceProviderList(projectName: string) {
  const urlPath = project + `/${projectName}/providers`;
  return get(urlPath, {}).then((res) => res);
}
