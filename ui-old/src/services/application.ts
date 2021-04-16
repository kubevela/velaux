import { request } from 'umi';

export async function listApplications() {
  return request<API.ListApplicationsResponse>('/api/applications');
}

export async function addApplication(params: API.ApplicationType) {
  return request<API.ApplicationResponse>('/api/applications', {
    method: 'POST',
    data: {
      ...params,
      method: 'post',
    },
  });
}

export async function updateApplication(params: API.ApplicationType) {
  return request<API.ApplicationResponse>('/api/applications', {
    method: 'POST',
    data: {
      ...params,
      method: 'update',
    },
  });
}

export async function removeApplication(params: API.ApplicationType) {
  return request<API.ApplicationResponse>('/api/applications', {
    method: 'POST',
    data: {
      ...params,
      method: 'delete',
    },
  });
}
