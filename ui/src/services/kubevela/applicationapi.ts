// @ts-ignore
/* eslint-disable */
import { request } from 'umi';
import {vela} from "@/services/kubevela/application_pb";

export async function listApplications(cluster: string) {
  return request<{ applications: vela.api.model.Application[] }>(`/api/clusters/${cluster}/applications`);
}

export async function addApplication(cluster: string, params: vela.api.model.Application) {
  return request<{ application: vela.api.model.Application }>(`/api/clusters/${cluster}/applications`, {
    method: 'POST',
    data: {
      ...params,
      method: 'post',
    },
  });
}

export async function updateApplication(cluster: string, params: vela.api.model.Application) {
  return request<{ application: vela.api.model.Application }>(`/api/clusters/${cluster}/applications`, {
    method: 'PUT',
    data: {
      ...params,
      method: 'update',
    },
  });
}

export async function removeApplication(cluster: string, appName: string) {
  return request<{ application: vela.api.model.Application }>(`/api/clusters/${cluster}/applications/${appName}`, {
    method: 'DELETE',
  });
}
