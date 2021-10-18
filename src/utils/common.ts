import { AppObj } from '../model/application';

export function getAppCardList(data: AppObj) {
  const applicationsList = data.applications;
  const appContent = [];
  for (const item of applicationsList) {
    const rules = item.gatewayRule && item.gatewayRule[0];
    const { protocol, address, componentPort } = rules;
    const href = protocol + address + componentPort;
    const app = {
      name: item.name,
      status: item.status,
      icon: item.icon,
      description: item.description,
      createTime: item.createTime,
      btnContent: item.btnContent,
      href: href,
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

export function isAPPStorePath(pathname: string) {
  return (pathname || '').indexOf('/appstores') !== -1;
}

export const APPLICATION_PATH = 'applications';
export const CLUSTERS_PATH = 'clusters';
export const ADDONS_PATH = 'addons';
export const WORKFLOWS_PATH = 'workflows';
