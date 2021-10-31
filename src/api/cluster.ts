import { post, get } from './request';
import {
  cluster_mock,
  getClusterDetails_mock,
  clusterCloudList_mock,
  connectClusterCloud_mock,
} from './devLink';
import { cluster } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? cluster_mock : cluster;

export function getClusterList(params: any) {
  return get(url, { params: params }).then((res) => res);
}

export function createCluster(params: any) {
  delete params.page;
  delete params.pageSize;
  delete params.query;
  return post(url, params).then((res) => res);
}

export function getClusterDetails(params: any) {
  const url = isMock ? `${getClusterDetails_mock}` : `${cluster}/${params.clusterName}`;
  return get(url, params).then((res) => res);
}

export function getCloudClustersList(params: any) {
  const { provider, page, pageSize } = params;
  const url = isMock
    ? `${clusterCloudList_mock}`
    : `${cluster}/cloud-clusters/${provider}?page=${page}&pageSize=${pageSize}`;
  delete params.page;
  delete params.pageSize;
  delete params.provider;
  return post(url, params).then((res) => res);
}

export function connectcloudCluster(params: any) {
  const { provider } = params;
  const url = isMock ? `${connectClusterCloud_mock}` : `${cluster}/cloud-clusters/${provider}/connect`;
  delete params.provider;
  return post(url, params).then((res) => res);
}
