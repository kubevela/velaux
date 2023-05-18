import type { UIParam } from '@velaux/data';
import { getDomain } from '../utils/common';

import { definition } from './productionLink';
import { get, put } from './request';

const baseURLOject = getDomain();
const base = baseURLOject.APIBASE;

export function getDefinitionsList(params: {
  definitionType: 'component' | 'trait' | 'workflowstep' | 'policy';
  queryAll: boolean;
}) {
  const url = base + definition;
  const { definitionType, queryAll } = params;
  return get(url, { params: { type: definitionType, queryAll } }).then((res) => res);
}

export function detailDefinition(params: { name: string; type: string }) {
  const url = base + `${definition}/${params.name}`;
  return get(url, { params: { type: params.type } }).then((res) => res);
}

export function updateDefinitionStatus(params: {
  name: string;
  hiddenInUI: boolean;
  type: string;
}) {
  const url = base + `${definition}/${params.name}/status`;
  const paramsData = {
    hiddenInUI: params.hiddenInUI,
    type: params.type,
  };
  return put(url, paramsData).then((res) => res);
}

export function updateUISchema(params: {
  name: string;
  definitionType: string;
  uiSchema: UIParam[] | undefined;
}) {
  const url = base + `${definition}/${params.name}/uischema`;
  const paramsData = {
    type: params.definitionType,
    uiSchema: params.uiSchema,
  };
  return put(url, paramsData).then((res) => res);
}

export function getComponentDefinitions() {
  const _url = base + definition;
  return get(_url, { params: { type: 'component' } }).then((res) => res);
}

export function detailComponentDefinition(params: { name: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'component' } }).then((res) => res);
}

export function getPolicyDefinitions() {
  const _url = base + definition;
  return get(_url, { params: { type: 'policy' } }).then((res) => res);
}

export function detailPolicyDefinition(params: { name: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'policy' } }).then((res) => res);
}

export function getTraitDefinitions(params: { appliedWorkload: string }) {
  const _url = base + definition;
  return get(_url, { params: { type: 'trait', appliedWorkload: params.appliedWorkload } }).then(
    (res) => res,
  );
}

export function detailTraitDefinition(params: { name: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'trait' } }).then((res) => res);
}
