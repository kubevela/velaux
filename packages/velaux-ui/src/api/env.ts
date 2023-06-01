import type { CreateEnvRequest } from '@velaux/data';
import type { QueryTarget } from '../model/target';
import { getDomain } from '../utils/common';

import { envURL } from './productionLink';
import { post, get, rdelete, put } from './request';

const baseURLOject = getDomain();
const base = baseURLOject.MOCK || baseURLOject.APIBASE;
export function getEnvs(params: QueryTarget) {
  const url = base + envURL;
  return get(url, { params: params }).then((res) => res);
}

export function createEnv(params: CreateEnvRequest) {
  const url = base + envURL + '?project=' + params.project;
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
