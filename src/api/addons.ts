import { post, get } from './request';
import { addons_dev } from './devLink';
import { addons } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
let url = isMock ? addons_dev : addons;

export function getAddonsList(params: any) {
  return get(url, params).then((res) => res);
}

export function createAddons(params: any) {
  return post(url, params).then((res) => res);
}

export function getAddonsDetails(params: any) {
  if (!isMock) {
    url = `${addons}/${params.name}`;
  }
  return get(url, params).then((res) => res);
}

export function disabletAddonsCluster(params: any) {
  if (!isMock) {
    url = `${addons}/${params.name}/disable`;
  }
  return post(url, params).then((res) => res);
}

export function enableAddonsCluster(params: any) {
  if (!isMock) {
    url = `${addons}/${params.name}/enable`;
  }
  return post(url, params).then((res) => res);
}

export function getAddonsStatus(params: any) {
  if (!isMock) {
    url = `${addons}/${params.status}`;
  }
  return get(url, params).then((res) => res);
}
