import { request } from 'umi';

export async function listClusters() {
  return request<API.ListClustersResponse>('/api/clusters');
}

export async function addCluster(params: API.ClusterType) {
  return request<API.ClusterResponse>('/api/clusters', {
    method: 'POST',
    data: {
      ...params,
      method: 'post',
    },
  });
}

export async function updateCluster(params: API.ClusterType) {
  return request<API.ClusterResponse>('/api/clusters', {
    method: 'POST',
    data: {
      ...params,
      method: 'update',
    },
  });
}

export async function removeCluster(params: API.ClusterType) {
  return request<API.ClusterResponse>('/api/clusters', {
    method: 'POST',
    data: {
      ...params,
      method: 'delete',
    },
  });
}
