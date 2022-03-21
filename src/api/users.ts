import { post, get, rdelete, put } from './request';
import type { User } from '../interface/user';
import { users } from './productionLink';

type UserQuery = {
  name: string;
  alias?: string;
  email?: string;
  page: number;
  pageSize: number;
};

export function getUserList(params: UserQuery) {
  const url = users;
  return get(url, { params: params }).then((res) => res);
}

export function createUser(params: User) {
  const url = users;
  return post(url, params).then((res) => res);
}

export function updateUser(params: User) {
  const urlPath = users + `/${params.name}`;
  return put(urlPath, params).then((res) => res);
}

export function deleteUser(params: { name: string }) {
  const urlPath = users + `/${params.name}`;
  return rdelete(urlPath, {}).then((res) => res);
}

export function changeUserDisable(params: { name: string }) {
  const urlPath = users + `/${params.name}/disable`;
  return get(urlPath, {}).then((res) => res);
}

export function changeUserEnable(params: { name: string }) {
  const urlPath = users + `/${params.name}/enable`;
  return get(urlPath, {}).then((res) => res);
}
