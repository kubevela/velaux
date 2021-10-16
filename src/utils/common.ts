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

export function isDEVEnvironment() {
  return process.env.NODE_ENV == 'development' ? true : false;
}
