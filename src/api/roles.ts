import { post, get, rdelete, put } from './request';
import { RolesCreateBase } from '../interface/roles';
import { project_mock } from './devLink';
import { roles } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? project_mock : roles;

export function getRoleList(params: { page?: number; pageSize?: number }) {
  return get(url, { params: params }).then((res) => res);
}

export function createRole(params: RolesCreateBase) {
  return post(url, params).then((res) => res);
}

export function updateRole(params: RolesCreateBase) {
  const urlPath = roles + `/${params.name}`;
  return put(urlPath, params).then((res) => res);
}

export function deleteRole(params: { name: string }) {
  const urlPath = roles + `/${params.name}`;
  return rdelete(urlPath, {}).then((res) => res);
}
