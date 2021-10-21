import { post, get } from './request';
import { namespace_dev } from './devLink';
import { namespace } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
let url = isMock ? namespace_dev : namespace;

export function getNamespaceList(params: any) {
  return get(url, params).then((res) => res);
}

export function createNamespace(params: any) {
  return post(url, params).then((res) => res);
}

export function getOneNamespace(params: any) {
  if (!isMock) {
    url = `${namespace}/${params.namespace}`;
  }
  return get(url, params).then((res) => res);
}
