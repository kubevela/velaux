import { getDomain } from '../utils/common';

import { managePlugin } from './productionLink';
import { get, post } from './request';
import { PluginEnableRequest } from "@velaux/data";

const baseURLOject = getDomain();
const base = baseURLOject.MOCK || baseURLOject.APIBASE;

export function getPluginList(params: any) {
  return get(base + managePlugin, { params: params }).then((res) => res);
}

export function enablePlugin(params: PluginEnableRequest) {
  return post(`${base + managePlugin}/${params.name}/enable`, params);
}

export function disablePlugin(params: { name: string }) {
  return post(`${base + managePlugin}/${params.name}/disable`, params);
}
