import type { UIParam } from '@velaux/data';
import { getDomain } from '../utils/common';

import { definition } from './productionLink';
import { get, put } from './request';

const baseURLOject = getDomain();
const base = baseURLOject.APIBASE;

// Every call names the project whose own definitions, in its namespace, are
// offered beside the global ones; '' is the global ones alone. A call about one
// definition finds the project's, else the global one, unless where names one;
// a change reaches the project's only with where 'project'.
export type DefinitionWhere = 'project' | 'global';

const inProject = (project: string, where?: DefinitionWhere) => ({
  ...(project ? { project } : {}),
  ...(where ? { where } : {}),
});

// withQuery is url with the project and where in its query, for a change.
const withQuery = (url: string, project: string, where?: DefinitionWhere) => {
  const query = new URLSearchParams(inProject(project, where)).toString();
  return query ? `${url}?${query}` : url;
};

export function getDefinitionsList(params: {
  project: string;
  definitionType: 'component' | 'trait' | 'workflowstep' | 'policy' | 'source';
  queryAll: boolean;
}) {
  const url = base + definition;
  const { definitionType, queryAll } = params;
  return get(url, { params: { type: definitionType, queryAll, ...inProject(params.project) } }).then((res) => res);
}

export function detailDefinition(params: { project: string; where?: DefinitionWhere; name: string; type: string }) {
  const url = base + `${definition}/${params.name}`;
  return get(url, { params: { type: params.type, ...inProject(params.project, params.where) } }).then((res) => res);
}

export function updateDefinitionStatus(params: {
  project: string;
  where?: DefinitionWhere;
  name: string;
  hiddenInUI: boolean;
  type: string;
}) {
  const url = base + `${definition}/${params.name}/status`;
  const paramsData = {
    hiddenInUI: params.hiddenInUI,
    type: params.type,
  };
  return put(withQuery(url, params.project, params.where), paramsData).then((res) => res);
}

export function updateUISchema(params: {
  project: string;
  where?: DefinitionWhere;
  name: string;
  definitionType: string;
  uiSchema: UIParam[] | undefined;
}) {
  const url = base + `${definition}/${params.name}/uischema`;
  const paramsData = {
    type: params.definitionType,
    uiSchema: params.uiSchema,
  };
  return put(withQuery(url, params.project, params.where), paramsData).then((res) => res);
}

// namespaces, when given, have each definition report in unusableIn those its
// restrictions keep from using it.
export function getComponentDefinitions(project: string, namespaces?: string[]) {
  const _url = base + definition;
  return get(_url, { params: { type: 'component', namespaces: namespaces?.join(','), ...inProject(project) } }).then(
    (res) => res
  );
}

export function detailComponentDefinition(params: { project: string; name: string; revision?: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'component', revision: params.revision, ...inProject(params.project) } }).then(
    (res) => res
  );
}

export function getPolicyDefinitions(project: string, namespaces?: string[]) {
  const _url = base + definition;
  return get(_url, { params: { type: 'policy', namespaces: namespaces?.join(','), ...inProject(project) } }).then(
    (res) => res
  );
}

export function detailPolicyDefinition(params: { project: string; name: string; revision?: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'policy', revision: params.revision, ...inProject(params.project) } }).then(
    (res) => res
  );
}

export function getSourceDefinitions(project: string, namespaces?: string[]) {
  const _url = base + definition;
  return get(_url, { params: { type: 'source', namespaces: namespaces?.join(','), ...inProject(project) } }).then(
    (res) => res
  );
}

export function detailSourceDefinition(params: { project: string; name: string; revision?: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'source', revision: params.revision, ...inProject(params.project) } }).then(
    (res) => res
  );
}

export function getTraitDefinitions(params: { project: string; appliedWorkload: string; namespaces?: string[] }) {
  const _url = base + definition;
  return get(_url, {
    params: {
      type: 'trait',
      appliedWorkload: params.appliedWorkload,
      namespaces: params.namespaces?.join(','),
      ...inProject(params.project),
    },
  }).then((res) => res);
}

export function getDefinitionUsage(params: {
  project: string;
  where?: DefinitionWhere;
  name: string;
  type: 'component' | 'trait';
}) {
  const _url = `${base + definition}/${params.name}/usage`;
  return get(_url, { params: { type: params.type, ...inProject(params.project, params.where) } }).then((res) => res);
}

// getDefinitionCUE is a definition as CUE, as vela def get writes it.
export function getDefinitionCUE(params: { project: string; where?: DefinitionWhere; name: string; type: string }) {
  const _url = `${base + definition}/${params.name}/cue`;
  return get(_url, { params: { type: params.type, ...inProject(params.project, params.where) } }).then((res) => res);
}

// getDefinitionDoc is a definition's reference documentation in Markdown, as
// vela show generates it, in the UI's language.
export function getDefinitionDoc(params: {
  project: string;
  where?: DefinitionWhere;
  name: string;
  type: string;
  lang: string;
}) {
  const _url = `${base + definition}/${params.name}/doc`;
  return get(_url, {
    params: { type: params.type, lang: params.lang, ...inProject(params.project, params.where) },
  }).then((res) => res);
}

export function detailTraitDefinition(params: { project: string; name: string; revision?: string }) {
  const _url = `${base + definition}/${params.name}`;
  return get(_url, { params: { type: 'trait', revision: params.revision, ...inProject(params.project) } }).then(
    (res) => res
  );
}

// listDefinitionRevisions lists a definition's revisions, newest first.
export function listDefinitionRevisions(params: {
  project: string;
  where?: DefinitionWhere;
  name: string;
  type: string;
}) {
  const _url = `${base + definition}/${params.name}/revisions`;
  return get(_url, { params: { type: params.type, ...inProject(params.project, params.where) } }).then((res) => res);
}
