import { post, get } from './request';
import { applicationList_dev } from './devLink';
import { applicationList } from './productionLink';
import { getDomain } from '../utils/common';
const baseURLOject = getDomain();
export function getApplicationList(params: any) {
  const url = baseURLOject.MOCK ? applicationList_dev : applicationList;
  return get(url, params).then((res) => res);
}

export function createApplicationList(params: any) {
  const url = baseURLOject.MOCK ? applicationList_dev : applicationList;
  return post(url, params).then((res) => res);
}
