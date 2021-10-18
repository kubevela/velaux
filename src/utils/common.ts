import { AppObj } from '../model/application';
type Navigator = {
  language: string;
  userLanguage?: string;
};

export function getLanguage() {
  let navigator: Navigator = window.navigator;
  const lang = navigator.language || navigator.userLanguage || 'zh';
  return localStorage.getItem('lang') || lang.split('-')[0];
}

export function getAppCardList(data: AppObj) {
  const applicationsList = data.applications;
  const appContent = [];
  for (const item of applicationsList) {
    const app = {
      name: item.name,
      status: item.status,
      icon: item.icon,
      description: item.description,
      createTime: item.createTime,
      btnContent: item.btnContent,
      href: item.description,
    };
    appContent.push(app);
  }
  return appContent;
}

export function isMock() {
  return process.env.MOCK == 'mock' ? true : false;
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

export const APPLICATION_PATH = 'applications';
export const CLUSTERS_PATH = 'clusters';
export const ADDONS_PATH = 'addons';
export const WORKFLOWS_PATH = 'workflows';
