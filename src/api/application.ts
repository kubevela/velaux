import { axiosInstance } from '../request';
import { applicationList_dev } from './devLink';
import { applicationList } from './productionLink';
import { isMock } from '../utils/common';

export function getApplicationList(params: any) {
  const url = isMock() ? applicationList_dev : applicationList;
  return axiosInstance.get(url, params).then((res) => res.data);
}

export function createApplicationList(params: any) {
  const url = isMock() ? applicationList_dev : applicationList;
  return axiosInstance.post(url, params).then((res) => res.data);
}
