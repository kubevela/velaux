import { post, get, rdelete } from './request';
import {
  addons_mock,
  addonsDetails_mock,
  disabletAddonsCluster_mock,
  enableAddonsCluster_mock,
  addonsStatus_mock,
} from './devLink';
import { addons, addonRegistrys } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? addons_mock : addons;

export function getAddonRegistrysList(params: any) {
  return get(addonRegistrys, { params: params }).then((res) => res);
}

export function createAddonRegistry(params: any) {
  return post(addonRegistrys, params);
}

export function deleteAddonRegistry(params: { name: string }) {
  return rdelete(addonRegistrys + '/' + params.name, params).then((res) => res);
}

export function getAddonsList(params: any) {
  return get(url, { params: params }).then((res) => res);
}

export function createAddons(params: any) {
  return post(url, params).then((res) => res);
}

export function getAddonsDetails(params: any) {
  const url = isMock ? `${addonsDetails_mock}` : `${addons}/${params.name}`;
  return get(url, params).then((res) => res);
}

export function disableAddon(params: any) {
  const url = isMock ? `${disabletAddonsCluster_mock}` : `${addons}/${params.name}/disable`;
  return post(url, params).then((res) => res);
}

export function enableAddon(params: any) {
  const url = isMock ? `${enableAddonsCluster_mock}` : `${addons}/${params.name}/enable`;

  return post(url, params).then((res) => res);
}

export function getAddonsStatus(params: any) {
  const url = isMock ? `${addonsStatus_mock}` : `${addons}/${params.name}/status`;
  return get(url, params).then((res) => res);
}
