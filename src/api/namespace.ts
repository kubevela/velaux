import { post, get } from './request';
import { namespace_dev } from './devLink';
import { namespace } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
export function getNamespaceList(params: any) {
  const url = baseURLOject.MOCK ? namespace_dev : namespace;
  return get(url, params).then((res) => res);
}

export function createNamespaceList(params: any) {
  const url = baseURLOject.MOCK ? namespace_dev : namespace;
  return post(url, params).then((res) => res);
}

export function getOneNamespace(params: any) {
  const realURL = `${namespace}/${params.namespace}`;
  const url = baseURLOject.MOCK ? namespace_dev : realURL;
  return get(url, params).then((res) => res);
}
