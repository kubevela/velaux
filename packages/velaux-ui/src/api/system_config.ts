import type { UpdateSystemInfo } from '../../../velaux-data/src/api/system';
import { getDomain } from '../utils/common';

import { get, put } from './request';
const domainObj = getDomain();
export const baseURL = domainObj.APIBASE || domainObj.MOCK;

export function loadSystemInfo() {
  const url = `/api/v1/system_info`;
  return get(url, {});
}

export function updateSystemInfo(params: UpdateSystemInfo) {
  const url = `/api/v1/system_info`;
  return put(url, params, true);
}
