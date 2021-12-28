import { post, get, rdelete, put } from './request';
import { addons, addonRegistrys, enabledAddon } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const base = baseURLOject.MOCK || baseURLOject.APIBASE;

export function getAddonRegistrysList(params: any) {
  return get(base + addonRegistrys, { params: params }).then((res) => res);
}

export function createAddonRegistry(params: any) {
  return post(base + addonRegistrys, params);
}

export function deleteAddonRegistry(params: { name: string }) {
  return rdelete(base + addonRegistrys + '/' + params.name, params).then((res) => res);
}

export function getAddonsList(params: any) {
  return get(base + addons, { params: params }).then((res) => res);
}

export function getAddonsDetails(params: { name: string }) {
  const gurl = `${base + addons}/${params.name}`;
  return get(gurl, params).then((res) => res);
}

export function disableAddon(params: { name: string }) {
  const gurl = `${base + addons}/${params.name}/disable`;
  return post(gurl, params).then((res) => res);
}

export function enableAddon(params: { name: string; properties: any }) {
  const gurl = `${base + addons}/${params.name}/enable`;
  return post(gurl, { args: params.properties }).then((res) => res);
}
export function upgradeAddon(params: { name: string; properties: any }) {
  const gurl = `${base + addons}/${params.name}/update`;
  return put(gurl, { args: params.properties }).then((res) => res);
}

export function getAddonsStatus(params: { name: string }) {
  const gurl = `${base + addons}/${params.name}/status`;
  return get(gurl, params).then((res) => res);
}

export function getEnabledAddons(params: any) {
  return get(base + enabledAddon, params);
}
