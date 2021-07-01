// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

export async function listApplications(cluster: string) {
  return request<{ applications: API.ApplicationType[] }>(`/api/clusters/${cluster}/applications`);
}

export async function getApplication(cluster: string, appName: string) {
  return request<{ application: API.ApplicationDetailType }>(`/api/clusters/${cluster}/applications/${appName}`);
}

export async function addApplication(cluster: string, params: API.ApplicationType) {
  return request<{ application: API.ApplicationType }>(`/api/clusters/${cluster}/applications`, {
    method: 'POST',
    data: {
      ...params,
      method: 'post',
    },
  });
}

export async function addApplicationYaml(cluster: string, yaml: string){
  return request<{ yaml: string }>(`/api/clusters/${cluster}/appYaml`, {
    method: 'POST',
    data: {
      yaml,
      method: 'post',
    },
  });
}

export async function updateApplication(cluster: string, params: API.ApplicationType) {
  return request<{ application: API.ApplicationType }>(`/api/clusters/${cluster}/applications`, {
    method: 'PUT',
    data: {
      ...params,
      method: 'update',
    },
  });
}

export async function removeApplication(cluster: string, appName: string) {
  return request<{ application: API.ApplicationType }>(`/api/clusters/${cluster}/applications/${appName}`, {
    method: 'DELETE',
  });
}
