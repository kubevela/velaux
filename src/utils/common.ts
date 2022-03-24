import moment from 'moment';

type Navigator = {
  language: string;
  userLanguage?: string;
};

export function getLanguage() {
  const navigator: Navigator = window.navigator;
  const lang = navigator.language || navigator.userLanguage || 'en';
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

export function isTargetURL(pathname: string) {
  return (pathname || '').indexOf('/targets') !== -1;
}

export function isEnvPath(pathname: string) {
  return (pathname || '').indexOf('/envs') !== -1;
}

export function isUsersPath(pathname: string) {
  return (pathname || '').indexOf('/users') !== -1;
}
export function isProjectPath(pathname: string) {
  return (pathname || '').indexOf('/projects') !== -1;
}
export const APPLICATION_PATH = 'applications';
export const CLUSTERS_PATH = 'clusters';
export const ADDONS_PATH = 'addons';
export const WORKFLOWS_PATH = 'workflows';

export function momentDate(time: undefined | string): string {
  if (!time) {
    return '';
  }
  return moment(time).format('YYYY/MM/DD HH:mm:ss');
}

export function momentShortDate(time: undefined | string): string {
  if (!time) {
    return '';
  }
  return moment(time).format('YYYY/MM/DD');
}

export const checkName = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
export const urlRegular =
  /(https|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
export const checkImageName = /^[^\u4e00-\u9fa5 ]{0,512}$/;

export const formItemLayout = {
  labelCol: {
    fixedSpan: 6,
  },
  wrapperCol: {
    span: 18,
  },
};

export const ACKCLusterStatus = [
  {
    key: 'initial',
    value: '集群创建中',
    color: '#98af88',
  },
  {
    key: 'failed',
    value: '集群创建失败',
    color: '#ef1111',
  },
  {
    key: 'running',
    value: '集群运行中',
    color: '#10e60e',
  },
  {
    key: 'updating',
    value: '集群升级中',
    color: '#10e60e',
  },
  {
    key: 'updating_failed',
    value: '集群升级失败',
    color: '#ef1111',
  },
  {
    key: 'scaling',
    value: '集群伸缩中',
    color: '#10e60e',
  },
  {
    key: 'stopped',
    value: '集群已经停止运行',
    color: '#3a3e3a',
  },
  {
    key: 'deleting',
    value: '集群删除中',
    color: '#fd940f',
  },
  {
    key: 'deleted',
    value: '集群已经被删除',
    color: '#3a3e3a',
  },
  {
    key: 'delete_failed',
    value: '集群删除失败',
    color: '#ef1111',
  },
];

export const replaceUrl = function (text: string) {
  const re = /(http[s]?:\/\/([\w-]+.)+([:\d+])?(\/[\w-\.\/\?%&=]*)?)/gi;
  const str = text.replace(re, function (a) {
    return '<a href="' + a + '" target=_blank>' + a + '</a>';
  });
  return str;
};

export const checkUserPassWord = /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]{8,16})$/;
export const checkUserEmail = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$/;
