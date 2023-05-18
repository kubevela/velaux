import type { Target } from '@velaux/data';
import type { QueryTarget } from '../model/target';
import { getDomain } from '../utils/common';

import { gettarget_mock } from './devLink';
import { targetURL } from './productionLink';
import { post, get, rdelete, put } from './request';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;

export function getTarget(params: QueryTarget) {
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
