import { post, get } from './index';
import { applicationList_dev } from './devLink';
import { applicationList } from './productionLink';
import { isMock } from '../utils/common';

export function getApplicationList(params: any) {
  const url = isMock() ? applicationList_dev : applicationList;
  return get(url, params).then((res) => res);
}

export function createApplicationList(params: any) {
  const url = isMock() ? applicationList_dev : applicationList;
  return post(url, params).then((res) => res);
}
