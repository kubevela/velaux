import { post, get } from './request';
import { namespace_mock, getOneNamespace_mock } from './devLink';
import { namespace } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? namespace_mock : namespace;

export function getNamespaceList(params: any) {
  return get(url, params).then((res) => res);
}

export function createNamespace(params: any) {
  return post(url, params).then((res) => res);
}

export function getOneNamespace(params: any) {
  const url = isMock ? `getOneNamespace_mock` : `${namespace}/${params.namespace}`;
  return get(url, params).then((res) => res);
}
