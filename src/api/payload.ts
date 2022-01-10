import { get } from './request';
import { getDomain } from '../utils/common';
import { payloadTypeURL } from './productionLink';

const baseURLOject = getDomain();
const base = baseURLOject.MOCK || baseURLOject.APIBASE;
export function getPayloadType() {
  const url = base + payloadTypeURL;
  return get(url, {}).then((res) => res);
}
