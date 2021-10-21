import { post, get } from './request';
import { cluster_dev } from './devLink';
import { cluster } from './productionLink';
import { getDomain } from '../utils/common';
const baseURLOject = getDomain();

export function getClusterList(params: any) {
  const url = baseURLOject.MOCK ? cluster_dev : cluster;
  return get(url, params).then((res) => res);
}

export function createClusterList(params: any) {
  const url = baseURLOject.MOCK ? cluster_dev : cluster;
  return post(url, params).then((res) => res);
}

export function getClusterDetails(params: any) {
  const realURL = `${cluster}/${params.clusterName}`;
  const url = baseURLOject.MOCK ? cluster_dev : realURL;
  return get(url, params).then((res) => res);
}
