import moment from 'moment';

import type { AddonBaseStatus } from '@velaux/data';

type Navigator = {
  language: string;
};

export function getLanguage() {
  const navigator: Navigator = window.navigator;
  const lang = navigator.language || 'en';
  return localStorage.getItem('lang') || lang.split('-')[0];
}

export function isMock() {
  return process.env.MOCK ? true : false;
}

export function getDomain(): { MOCK: string | undefined; APIBASE: string | undefined } {
  const { MOCK, BASE_DOMAIN } = process.env;
  return {
    MOCK: MOCK || '',
    APIBASE: BASE_DOMAIN || '',
  };
}

export function isApplicationPath(pathname: string) {
  return (pathname || '').startsWith('/applications');
}
export function isClustersPath(pathname: string) {
  return (pathname || '').startsWith('/clusters');
}
export function isAddonsPath(pathname: string) {
  return (pathname || '').startsWith('/addons');
}
export function isOperationPath(pathname: string) {
  return (pathname || '').startsWith('/operation');
}
export function isModelPath(pathname: string) {
  return (pathname || '').startsWith('/model');
}

export function isAPPStorePath(pathname: string) {
  return (pathname || '').startsWith('/appstores');
}

export function isTargetURL(pathname: string) {
  return (pathname || '').startsWith('/targets');
}

export function isEnvPath(pathname: string) {
  return (pathname || '').startsWith('/envs');
}

export function isPipelinePath(pathname: string) {
  if ((pathname || '').startsWith('/pipelines')) {
    return true;
  }
  const re = new RegExp('^/projects/.*./pipelines.*');
  return re.test(pathname);
}

export function isUsersPath(pathname: string) {
  return (pathname || '').startsWith('/users');
}
export function isProjectPath(pathname: string) {
  const re = new RegExp('^/projects/.*./pipelines.*');
  if (re.test(pathname)) {
    return false;
  }
  return (pathname || '').startsWith('/projects');
}

export function isRolesPath(pathname: string) {
  return (pathname || '').startsWith('/roles');
}

export function isConfigPath(pathname: string) {
  return (pathname || '').startsWith('/config');
}

export function isDefinitionsPath(pathname: string) {
  return (pathname || '').startsWith('/definitions');
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

export function beautifyTime(time?: string) {
  if (!time || time === '0001-01-01T00:00:00Z') {
    return '';
  }
  const timestamp = moment(time).unix();
  const now = new Date();
  let mistiming = Math.round(now.getTime() / 1000) - timestamp;
  const postfix = mistiming > 0 ? 'ago' : 'later';
  mistiming = Math.abs(mistiming);
  const arrr = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
  const arrn = [31536000, 2592000, 604800, 86400, 3600, 60, 1];

  for (let i = 0; i < 7; i++) {
    const inm = Math.floor(mistiming / arrn[i]);
    if (inm != 0) {
      return inm + ' ' + arrr[i] + ' ' + postfix;
    }
  }
  return '';
}

export function timeDiff(start?: string, end?: string): string {
  if (!start || start == '0001-01-01T00:00:00Z') {
    return '-';
  }
  let endTime = moment(moment.now());
  if (end && end != '0001-01-01T00:00:00Z') {
    endTime = moment(end);
  }
  const seconds = endTime.diff(moment(start), 'seconds');
  if (seconds > 60) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function beautifyBinarySize(value?: number) {
  if (null == value || value == 0) {
    return '0 Bytes';
  }
  const unitArr = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let index = 0;
  index = Math.floor(Math.log(value) / Math.log(1024));
  const size = value / Math.pow(1024, index);
  let sizeStr = '';
  if (size % 1 === 0) {
    sizeStr = size.toFixed(0);
  } else {
    sizeStr = size.toFixed(2);
  }
  return sizeStr + unitArr[index];
}

export const checkName = /^[a-z]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
export const urlRegular = /(https|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
export const checkImageName = /^[^\u4e00-\u9fa5 ]{0,512}$/;

export const formItemLayout = {
  labelCol: {
    fixedSpan: 6,
  },
  wrapperCol: {
    span: 18,
  },
};

export const ACKClusterStatus = [
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

export const checkUserPassword = /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]{8,16})$/;

export function isMatchBusinessCode(businessCode: number) {
  const tokenExpiredList = [12002, 12010];
  return tokenExpiredList.includes(businessCode);
}

export function equalArray(a?: string[], b?: string[]) {
  if (a === undefined && b === undefined) {
    return true;
  }
  if (b === undefined || a === undefined) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  } else {
    const sa = a.sort();
    const sb = b.sort();
    for (let i = 0; i < sa.length; i++) {
      if (sa[i] !== sb[i]) {
        return false;
      }
    }
    return true;
  }
}

export function intersectionArray(a?: string[], b?: string[]): string[] | undefined {
  if (a == undefined || b == undefined) {
    return undefined;
  }
  return a.filter((v) => b.indexOf(v) > -1);
}

export function checkEnabledAddon(addonName: string, enabledAddons?: AddonBaseStatus[]) {
  if (!enabledAddons) {
    return false;
  }
  const addonNames = enabledAddons.map((addon) => {
    return addon.name;
  });
  if (addonNames.includes(addonName)) {
    return true;
  }
  return false;
}

export function convertAny(data?: any): string {
  if (!data) {
    return '';
  }
  switch (typeof data) {
    case 'string':
      return data;
    case 'boolean':
      return data === true ? 'true' : 'false';
    case 'object':
      return JSON.stringify(data);
    case 'number':
      return data.toString();
    default:
      return '';
  }
}

export function showAlias(name: string, alias?: string): string;
export function showAlias(item: { name: string; alias?: string }): string;
export function showAlias(item: { name: string; alias?: string } | string, alias?: string) {
  if (typeof item === 'string') {
    if (alias) {
      return `${item}(${alias})`;
    }
    return item;
  }
  if (!item) {
    return '';
  }
  if (item.alias) {
    return `${item.name}(${item.alias})`;
  }
  return item.name;
}
