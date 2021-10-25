import moment from 'moment';

type Navigator = {
  language: string;
  userLanguage?: string;
};

export function getLanguage() {
  let navigator: Navigator = window.navigator;
  const lang = navigator.language || navigator.userLanguage || 'zh';
  return localStorage.getItem('lang') || lang.split('-')[0];
}

export function isMock() {
  return process.env.MOCK ? true : false;
}

export function getDomain(): { MOCK: string | undefined; APIBASE: string | undefined } {
  const { MOCK, BASE_DOMAIN } = process.env;
  return {
    MOCK: MOCK,
    APIBASE: BASE_DOMAIN || '',
  };
}

export function isApplicationPath(pathname: string) {
  return (pathname || '').indexOf('/applications') !== -1;
}
export function isClustersPath(pathname: string) {
  return (pathname || '').indexOf('/clusters') !== -1;
}
export function isAddonsPath(pathname: string) {
  return (pathname || '').indexOf('/addons') !== -1;
}
export function isOperationPath(pathname: string) {
  return (pathname || '').indexOf('/operation') !== -1;
}
export function isModelPath(pathname: string) {
  return (pathname || '').indexOf('/model') !== -1;
}

export function isAPPStorePath(pathname: string) {
  return (pathname || '').indexOf('/appstores') !== -1;
}

export const APPLICATION_PATH = 'applications';
export const CLUSTERS_PATH = 'clusters';
export const ADDONS_PATH = 'addons';
export const WORKFLOWS_PATH = 'workflows';

export function momentDate(time: string): string {
  return moment(time).format('YYYY/MM/DD HH:MM');
}
