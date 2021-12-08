import { post, get } from './request';
import { project_mock } from './devLink';
import { project } from './productionLink';
import { getDomain } from '../utils/common';

const baseURLOject = getDomain();
const isMock = baseURLOject.MOCK;
const url = isMock ? project_mock : project;

export function getProjectList(params: any) {
  return get(url, params).then((res) => res);
}

export function createProject(params: any) {
  return post(url, params).then((res) => res);
}
