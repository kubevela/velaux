import { request } from 'umi';

export async function listEnvironments() {
  return request<API.ListEnvironmentsResponse>('/api/environments');
}

export async function listCapabilities(envName: string) {
  return request<API.ListCapabilitiesResponse>('/api/environments/' + envName + '/capabilities');
}

export async function addEnvironment(params: API.EnvironmentType) {
  return request<API.EnvironmentResponse>('/api/environments', {
    method: 'POST',
    data: {
      ...params,
      method: 'post',
    },
  });
}

export async function updateEnvironment(params: API.EnvironmentType) {
  return request<API.EnvironmentResponse>('/api/environments', {
    method: 'POST',
    data: {
      ...params,
      method: 'update',
    },
  });
}

export async function removeEnvironment(params: API.EnvironmentType) {
  return request<API.EnvironmentResponse>('/api/environments', {
    method: 'POST',
    data: {
      ...params,
      method: 'delete',
    },
  });
}
