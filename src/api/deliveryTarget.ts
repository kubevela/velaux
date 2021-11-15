import { post, get, rdelete, put } from './request';
import {
  getDeliveryTarget_mock,
} from './devLink';
import { deliveryTarget } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;

export function getDeliveryTarget(params: any) {
  const url = isMock ? getDeliveryTarget_mock : deliveryTarget;
  return get(url, { params: params }).then((res) => res);
}

export function createDeliveryTarget(params: any) {
  const url = isMock ? getDeliveryTarget_mock : deliveryTarget;
  return post(url, params);
}

export function deleteDeliveryTarget(params: any) {
  const url = isMock ? getDeliveryTarget_mock : `${deliveryTarget}/${params.name}`;;
  return rdelete(url, params);
}

export function updateDeliveryTarget(params: any) {
  const url = isMock ? getDeliveryTarget_mock : `${deliveryTarget}/${params.name}`;;
  return put(url, params);
}



