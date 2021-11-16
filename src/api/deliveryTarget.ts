import { post, get, rdelete, put } from './request';
import { getDeliveryTarget_mock } from './devLink';
import { deliveryTarget } from './productionLink';
import { getDomain } from '../utils/common';
import { DeliveryTarget, QueryDeliveryTarget } from '../interface/deliveryTarget';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;

export function getDeliveryTarget(params: QueryDeliveryTarget) {
  const url = isMock ? getDeliveryTarget_mock : deliveryTarget;
  return get(url, { params: params }).then((res) => res);
}

export function createDeliveryTarget(params: DeliveryTarget) {
  const url = isMock ? getDeliveryTarget_mock : deliveryTarget;
  return post(url, params);
}

export function deleteDeliveryTarget(params: DeliveryTarget) {
  const url = isMock ? getDeliveryTarget_mock : `${deliveryTarget}/${params.name}`;
  return rdelete(url, params);
}

export function updateDeliveryTarget(params: DeliveryTarget) {
  const url = isMock ? getDeliveryTarget_mock : `${deliveryTarget}/${params.name}`;
  return put(url, params);
}
