// @ts-ignore
/* eslint-disable */
import { request } from 'umi';
import {vela} from "@/services/kubevela/cluster_pb";

export async function listClusterNames() {
  return request<{ clusters: string[] }>('/api/clusternames');
}

export async function listClusters() {
  return request<{ clusters: vela.api.model.Cluster[] }>('/api/clusters');
}

export async function addCluster(params: vela.api.model.Cluster) {
  return request<{ cluster: vela.api.model.Cluster }>('/api/clusters', {
    method: 'POST',
    data: {
      ...params,
      method: 'post',
    },
  });
}

export async function updateCluster(params: vela.api.model.Cluster) {
  return request<{ cluster: vela.api.model.Cluster }>('/api/clusters', {
    method: 'POST',
    data: {
      ...params,
      method: 'update',
    },
  });
}

export async function removeCluster(params: vela.api.model.Cluster) {
  return request<{ cluster: vela.api.model.Cluster }>(`/api/clusters/${params.name}`, {
    method: 'DELETE',
    data: {
      ...params,
      method: 'delete',
    },
  });
}

export async function listComponentDefinitions(cluster: string) {
  return request<{ definitions: vela.api.model.Cluster[] }>(
    `/api/clusters/${cluster}/componentdefinitions`,
  );
}

export async function listTraitDefinitions(cluster: string) {
  return request<{ definitions: vela.api.model.Cluster[] }>(
    `/api/clusters/${cluster}/traitdefinitions`,
  );
}

export async function isVelaInstalled(cluster: string) {
  return request<{ installed: boolean }>(`/api/clusters/${cluster}/isvelainstalled`);
}

export async function installVelaController(cluster: string, helmrepo: string, version: string) {
  return request<{ version: string }>(`/api/clusters/${cluster}/installvela`, {
    params: { helmrepo, version },
  });
}


export async function getSchema(cluster: string, name: string, namespace: string, type: string) {
  return request<{ definitions: API.CapabilityType[] }>(
    `/api/clusters/${cluster}/schema`, {
      params:{ name, namespace, type },
    });
}
