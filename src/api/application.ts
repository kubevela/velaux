import request from '../request';
import { applicationList_dev } from './devLink';
import { applicationList } from './productionLink';
import { isMock } from '../utils/common';
export function getApplicationList(params: any) {
  const url = isMock() ? applicationList_dev : applicationList;
  return request(url, params)
    .then((res) => {
      return res;
    })
    .catch((err) => err);
}
