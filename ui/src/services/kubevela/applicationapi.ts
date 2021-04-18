// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

export async function listApplications(cluster: string) {
  return request<{ applications: API.ApplicationType[] }>(`/api/clusters/${cluster}/applications`);
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

export async function updateApplication(cluster: string, params: API.ApplicationType) {
  return request<{ application: API.ApplicationType }>(`/api/clusters/${cluster}/applications`, {
    method: 'POST',
    data: {
      ...params,
      method: 'update',
    },
  });
}

export async function removeApplication(cluster: string, params: API.ApplicationType) {
  return request<{ application: API.ApplicationType }>(`/api/clusters/${cluster}/applications`, {
    method: 'POST',
    data: {
      ...params,
      method: 'delete',
    },
  });
}
