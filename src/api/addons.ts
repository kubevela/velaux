import { post, get } from './request';
import {
  addons_mock,
  addonsDetails_mock,
  disabletAddonsCluster_mock,
  enableAddonsCluster_mock,
  addonsStatus_mock,
} from './devLink';
import { addons } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
let url = isMock ? addons_mock : addons;

export function getAddonsList(params: any) {
  return get(url, params).then((res) => res);
}

export function createAddons(params: any) {
  return post(url, params).then((res) => res);
}

export function getAddonsDetails(params: any) {
  url = isMock ? `${addonsDetails_mock}` : `${addons}/${params.name}`;
  return get(url, params).then((res) => res);
}

export function disabletAddonsCluster(params: any) {
  url = isMock ? `${disabletAddonsCluster_mock}` : `${addons}/${params.name}/disable`;
  return post(url, params).then((res) => res);
}

export function enableAddonsCluster(params: any) {
  url = isMock ? `${enableAddonsCluster_mock}` : `${addons}/${params.name}/enable`;

  return post(url, params).then((res) => res);
}

export function getAddonsStatus(params: any) {
  url = isMock ? `${addonsStatus_mock}` : `${addons}/${params.status}`;
  return get(url, params).then((res) => res);
}
