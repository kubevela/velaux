import { getDomain } from '../utils/common';

import { managePlugin } from './productionLink';
import { get, post } from './request';
import { PluginEnableRequest, PluginInstallRequest } from "@velaux/data";

const baseURLOject = getDomain();
const base = baseURLOject.MOCK || baseURLOject.APIBASE;

export function getPluginList(params: any) {
  return get(base + managePlugin, { params: params }).then((res) => res);
}

export function detailPlugin(params: { id: string }) {
  return get(`${base + managePlugin}/${params.id}`, { params: params }).then((res) => res);
}

export function enablePlugin(params: PluginEnableRequest) {
  return post(`${base + managePlugin}/${params.id}/enable`, params);
}

export function disablePlugin(params: { id: string }) {
  return post(`${base + managePlugin}/${params.id}/disable`, params);
}

export function setPlugin(params: PluginEnableRequest) {
  return post(`${base + managePlugin}/${params.id}/setting`, params);
}

export function installPlugin(params: PluginInstallRequest) {
  return post(`${base + managePlugin}/${params.id}/install`, { url: params.url });
}

export function uninstallPlugin(params: { id: string }) {
  return post(`${base + managePlugin}/${params.id}/uninstall`, {});
}
