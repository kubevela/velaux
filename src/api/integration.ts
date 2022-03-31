import { post, get, rdelete } from './request';
import { ConfigType, QueryConfig } from '../interface/integrations';
import { getDomain } from '../utils/common';
import { integrations } from './productionLink';

const baseURLOject = getDomain();
const base = baseURLOject.APIBASE;
export function getConfigTypes() {
  const url = base + integrations;
  return get(url, {}).then((res) => res);
}

export function getConfigType(queryData: ConfigType) {
  const url = base + integrations + `${queryData.configType}`;
  return get(url, {}).then((res) => res);
}

export function createConfigType(queryData: ConfigType, params: any) {
  const url = base + integrations + `/${queryData.configType}`;
  return post(url, params).then((res) => res);
}

export function getConfigs(queryData: ConfigType) {
  const url = base + integrations + `/${queryData.configType}/configs`;
  return get(url, {}).then((res) => res);
}

export function getConfig(queryData: QueryConfig) {
  const url = base + integrations + `${queryData.configType}/configs/${queryData.name}`;
  return get(url, {}).then((res) => res);
}

export function deleteConfig(queryData: QueryConfig) {
  const url = base + integrations + `/${queryData.configType}/configs/${queryData.name}`;
  return rdelete(url, {}).then((res) => res);
}
