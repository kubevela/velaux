// @ts-ignore
/* eslint-disable */
import { request, useParams } from 'umi';

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

export async function listComponentDefinitions(cluster: string) {
  return request<API.ComponentDefinitionsResponse>(`/api/clusters/${cluster}/componentdefinitions`);
}

export async function listTraitDefinitions(cluster: string) {
  return request<API.TraitDefinitionsResponse>(`/api/clusters/${cluster}/traitdefinitions`);
}
