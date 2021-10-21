import { post, get } from './request';
import { addons_dev } from './devLink';
import { addons } from './productionLink';
import { getDomain } from '../utils/common';
const baseURLOject = getDomain();

export function getAddonsList(params: any) {
  const url = baseURLOject.MOCK ? addons_dev : addons;
  return get(url, params).then((res) => res);
}

export function createAddons(params: any) {
  const url = baseURLOject.MOCK ? addons_dev : addons;
  return post(url, params).then((res) => res);
}

export function getAddonsDetails(params: any) {
  const realURL = `${addons}/${params.name}`;
  const url = baseURLOject.MOCK ? addons_dev : realURL;
  return get(url, params).then((res) => res);
}

export function disabletAddonsCluster(params: any) {
  const realURL = `${addons}/${params.name}/disable`;
  const url = baseURLOject.MOCK ? addons_dev : realURL;
  return post(url, params).then((res) => res);
}

export function enableAddonsCluster(params: any) {
  const realURL = `${addons}/${params.name}/enable`;
  const url = baseURLOject.MOCK ? addons_dev : realURL;
  return post(url, params).then((res) => res);
}

export function getAddonsStatus(params: any) {
  const realURL = `${addons}/${params.status}`;
  const url = baseURLOject.MOCK ? addons_dev : realURL;
  return get(url, params).then((res) => res);
}
