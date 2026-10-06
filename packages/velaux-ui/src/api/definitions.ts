import type { UIParam } from '@velaux/data';
import { getDomain } from '../utils/common';

import { definition } from './productionLink';
import { get, put } from './request';

const baseURLOject = getDomain();
const base = baseURLOject.APIBASE;

export function getDefinitionsList(params: {
  definitionType: 'component' | 'trait' | 'workflowstep' | 'policy' | 'source';
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

export function updateDefinitionStatus(params: { name: string; hiddenInUI: boolean; type: string }) {
  const url = base + `${definition}/${params.name}/status`;
  const paramsData = {
    hiddenInUI: params.hiddenInUI,
    type: params.type,
  };
  return put(url, paramsData).then((res) => res);
}

export function updateUISchema(params: { name: string; definitionType: string; uiSchema: UIParam[] | undefined }) {
  const url = base + `${definition}/${params.name}/uischema`;
  const paramsData = {
    type: params.definitionType,
    uiSchema: params.uiSchema,
  };
  return put(url, paramsData).then((res) => res);
}

// namespaces, when given, have each definition report in unusableIn those its
// restrictions keep from using it.
export function getComponentDefinitions(namespaces?: string[]) {
  const _url = base + definition;
  return get(_url, { params: { type: 'component', namespaces: namespaces?.join(',') } }).then((res) => res);
}

export function detailComponentDefinition(params: { name: string; revision?: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'component', revision: params.revision } }).then((res) => res);
}

export function getPolicyDefinitions(namespaces?: string[]) {
  const _url = base + definition;
  return get(_url, { params: { type: 'policy', namespaces: namespaces?.join(',') } }).then((res) => res);
}

export function detailPolicyDefinition(params: { name: string; revision?: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'policy', revision: params.revision } }).then((res) => res);
}

export function getSourceDefinitions(namespaces?: string[]) {
  const _url = base + definition;
  return get(_url, { params: { type: 'source', namespaces: namespaces?.join(',') } }).then((res) => res);
}

export function detailSourceDefinition(params: { name: string; revision?: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'source', revision: params.revision } }).then((res) => res);
}

export function getTraitDefinitions(params: { appliedWorkload: string; namespaces?: string[] }) {
  const _url = base + definition;
  return get(_url, {
    params: { type: 'trait', appliedWorkload: params.appliedWorkload, namespaces: params.namespaces?.join(',') },
  }).then((res) => res);
}

export function getDefinitionUsage(params: { name: string; type: 'component' | 'trait' }) {
  const _url = `${base + definition}/${params.name}/usage`;
  return get(_url, { params: { type: params.type } }).then((res) => res);
}

// getDefinitionCUE is a definition as CUE, as vela def get writes it.
export function getDefinitionCUE(params: { name: string; type: string }) {
  const _url = `${base + definition}/${params.name}/cue`;
  return get(_url, { params: { type: params.type } }).then((res) => res);
}

// getDefinitionDoc is a definition's reference documentation in Markdown, as
// vela show generates it, in the UI's language.
export function getDefinitionDoc(params: { name: string; type: string; lang: string }) {
  const _url = `${base + definition}/${params.name}/doc`;
  return get(_url, { params: { type: params.type, lang: params.lang } }).then((res) => res);
}

export function detailTraitDefinition(params: { name: string; revision?: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'trait', revision: params.revision } }).then((res) => res);
}

// listDefinitionRevisions lists a definition's revisions, newest first.
export function listDefinitionRevisions(params: { name: string; type: string }) {
  const _url = `${base + definition}/${params.name}/revisions`;
  return get(_url, { params: { type: params.type } }).then((res) => res);
}
