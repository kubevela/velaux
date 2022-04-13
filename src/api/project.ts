import { post, get, rdelete, put } from './request';
import type {
  ProjectBaseCreate,
  ProjectName,
  QueryProjectUser,
  UserRoles,
  QueryProjectRole,
  ProjectRole,
  ProjectUserCreate,
  QueryData,
} from '../interface/project';
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

export function getProjectUsers(query: ProjectName) {
  const urlPath = project + `/${query.projectName}/users`;
  return get(urlPath, {}).then((res) => res);
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
export function getCloudServiceProviderList(queryData: QueryData) {
  const urlPath = project + `/${queryData.projectName}/configs?configType=${queryData.configType}`;
  return get(urlPath, {}).then((res) => res);
}

export function getProjectConfigs(query: ProjectName) {
  const urlPath = project + `/${query.projectName}/configs`;
  return get(urlPath, {}).then((res) => res);
}
