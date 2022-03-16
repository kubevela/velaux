import { post, get, rdelete, put } from './request';
import { getDomain } from '../utils/common';
import { getUserList_mock } from './devLink';
import type { User } from '../interface/user';
import { users } from './productionLink';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const base = baseURLOject.APIBASE;

export function getUserList(params: { query: string; page: number; pageSize: number }) {
  const url = isMock ? `${getUserList_mock}` : base + users;
  return get(url, { params: params }).then((res) => res);
}

export function createUser(params: User) {
  const url = isMock ? `${getUserList_mock}` : base + users;
  return post(url, { params: params }).then((res) => res);
}

export function updateUser(params: User) {
  const url = isMock ? `${getUserList_mock}` : base + users;
  return put(url, { params: params }).then((res) => res);
}

export function deleteUser(params: { name: string }) {
  const url = isMock ? `${getUserList_mock}` : base + users;
  return rdelete(url, { params: params }).then((res) => res);
}
