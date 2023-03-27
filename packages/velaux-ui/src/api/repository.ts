import { getDomain } from '../utils/common';

import { repository } from './productionLink';
import { get } from './request';

const baseURLOject = getDomain();
const baseURL = baseURLOject.APIBASE;

export function getChartValues(params: {
  url: string;
  repoType: string;
  secretName?: string;
  chart: string;
  version: string;
}) {
  const url =
    baseURL + repository + '/charts/' + params.chart + '/versions/' + params.version + '/values';
  return get(url, {
    params: { repoUrl: params.url, repoType: params.repoType, secretName: params.secretName },
  }).then((res) => res);
}

export function getChartValueFiles(params: {
  url: string;
  repoType: string;
  secretName?: string;
  chart: string;
  version: string;
  project?: string
}) {
  const url = baseURL + repository + '/chart/values';
  return get(url, {
    params: {
      repoUrl: params.url,
      repoType: params.repoType,
      secretName: params.secretName,
      chart: params.chart,
      version: params.version,
      project: params.project
    },
  }).then((res) => res);
}

export function getCharts(params: { url: string; repoType: string; secretName?: string; project?: string }) {
  const url = baseURL + repository + '/charts';
  return get(url, {
    params: { repoUrl: params.url, repoType: params.repoType, secretName: params.secretName, project: params.project },
  }).then((res) => res);
}

export function getChartVersions(params: {
  url: string;
  repoType: string;
  chart: string;
  secretName?: string;
  project?: string
}) {
  const url = baseURL + repository + '/chart/versions';
  return get(url, {
    params: {
      repoUrl: params.url,
      repoType: params.repoType,
      secretName: params.secretName,
      chart: params.chart,
      project: params.project
    },
  }).then((res) => res);
}

export function getChartRepos(params: { project?: string }) {
  const url = baseURL + repository + '/chart_repos';
  if (!params.project) {
    delete params.project;
  }
  return get(url, { params: params }).then((res) => res);
}

export function getImageRepos(params: { project: string }) {
  const url = baseURL + repository + '/image/repos';
  return get(url, { params: params }).then((res) => res);
}

export function getImageInfo(params: { project: string; secretName?: string; name: string }) {
  const url = baseURL + repository + '/image/info';
  return get(url, { params: params }).then((res) => res);
}
