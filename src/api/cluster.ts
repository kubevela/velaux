import { post, get, rdelete, put } from './request';
import {
  cluster_mock,
  getClusterDetails_mock,
  clusterCloudList_mock,
  connectClusterCloud_mock,
} from './devLink';
import { cluster } from './productionLink';
import { getDomain } from '../utils/common';
import { CreateCluster } from '../interface/cluster';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? cluster_mock : cluster;

export function getClusterList(params: any) {
  return get(url, { params: params }).then((res) => res);
}

export function createCluster(params: CreateCluster) {
  return post(url, params).then((res) => res);
}

export function updateCluster(params: CreateCluster) {
  return put(url + '/' + params.name, params);
}

export function deleteCluster(params: { clusterName: string }) {
  return rdelete(`${cluster}/${params.clusterName}`, params);
}

export function getClusterDetails(params: { clusterName: string }) {
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
  const url = isMock
    ? `${connectClusterCloud_mock}`
    : `${cluster}/cloud-clusters/${provider}/connect`;
  delete params.provider;
  return post(url, params).then((res) => res);
}

export function createClusterNamespace(params: { cluster: string; namespace: string }) {
  const url = `${cluster}/${params.cluster}/namespaces`;
  return post(url, { namespace: params.namespace }).then((res) => res);
}
