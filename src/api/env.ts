import { post, get, rdelete, put } from './request';
import { getDomain } from '../utils/common';
import type { Querytarget } from '../model/target';
import type { CreateEnvRequest } from '../interface/env';
import { envURL } from './productionLink';

const baseURLOject = getDomain();
const base = baseURLOject.MOCK || baseURLOject.APIBASE;
export function getEnvs(params: Querytarget) {
  const url = base + envURL;
  return get(url, { params: params }).then((res) => res);
}

export function createEnv(params: CreateEnvRequest) {
  const url = base + envURL;
  return post(url, params);
}

export function deleteEnv(params: { name: string }) {
  const url = base + `${envURL}/${params.name}`;
  return rdelete(url, params);
}

export function updateEnv(params: CreateEnvRequest) {
  const url = base + `${envURL}/${params.name}`;
  return put(url, params);
}
