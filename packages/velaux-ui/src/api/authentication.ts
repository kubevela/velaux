import {
  authenticationAdminConfigured,
  authenticationDexConfig,
  authenticationInitAdmin,
  authenticationLogin,
  authenticationLoginType,
  authenticationSystemInfo,
  authenticationUserInfo,
} from './productionLink';
import { get, post, put } from './request';

export function loginSSO(params: { code: string }) {
  const url = authenticationLogin;
  return post(url, { ...params }, true).then((res) => res);
}

export function loginLocal(params: { username: string; password: string }) {
  const url = authenticationLogin;
  return post(url, { ...params }, true).then((res) => res);
}

export function getDexConfig() {
  const url = authenticationDexConfig;
  return get(url, {}).then((res) => res);
}

export function getLoginType() {
  const url = authenticationLoginType;
  return get(url, {}).then((res) => res);
}

export function updateSystemInfo(params: { enableCollection: boolean; loginType: string }) {
  const url = authenticationSystemInfo;
  return put(url, params).then((res) => res);
}

export function getLoginUserInfo() {
  const url = authenticationUserInfo;
  return get(url, {}).then((res) => res);
}

export function isAdminConfigured() {
  const url = authenticationAdminConfigured
  return get(url, {}).then((res) => res);
}

export function initAdmin(params: { name: string; password: string; email: string }) {
  const url = authenticationInitAdmin
  return put(url, params).then((res) => res);
}
