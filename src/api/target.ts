import { post, get, rdelete, put } from './request';
import { gettarget_mock } from './devLink';
import { targetURL } from './productionLink';
import { getDomain } from '../utils/common';
import type { Target } from '../interface/target';
import type { Querytarget } from '../model/target';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;

export function getTarget(params: Querytarget) {
  const url = isMock ? gettarget_mock : targetURL;
  return get(url, { params: params }).then((res) => res);
}

export function createTarget(params: Target) {
  const url = isMock ? gettarget_mock : targetURL;
  return post(url, params);
}

export function deleteTarget(params: { name: string }) {
  const url = isMock ? gettarget_mock : `${targetURL}/${params.name}`;
  return rdelete(url, params);
}

export function updateTarget(params: Target) {
  const url = isMock ? gettarget_mock : `${targetURL}/${params.name}`;
  return put(url, params);
}
