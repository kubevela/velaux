import { post, get } from './request';
import { cluster_mock, getClusterDetails_mock } from './devLink';
import { cluster } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
let url = isMock ? cluster_mock : cluster;

export function getClusterList(params: any) {
  return get(url, params).then((res) => res);
}

export function createCluster(params: any) {
  return post(url, params).then((res) => res);
}

export function getClusterDetails(params: any) {
  url = isMock ? `${getClusterDetails_mock}` : `${cluster}/${params.clusterName}`;
  return get(url, params).then((res) => res);
}
