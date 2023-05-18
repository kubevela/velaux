import _ from 'lodash';

import type { ComponentDefinitionsBase,Endpoint  } from '@velaux/data';

type SelectGroupType = Array<{
  label: string;
  children: Array<{ label: string; value: string }>;
}>;

// code from https://github.com/kubernetes-client/javascript/blob/master/src/util.ts#L17
export function findSuffix(quantity: string): string {
  let ix = quantity.length - 1;
  while (ix >= 0 && !/[\.0-9]/.test(quantity.charAt(ix))) {
    ix--;
  }
  return ix === -1 ? '' : quantity.substring(ix + 1);
}

// code from https://github.com/kubernetes-client/javascript/blob/master/src/util.ts#L17
export function quantityToScalar(quantity: string): number | bigint {
  if (!quantity) {
    return 0;
  }
  const suffix = findSuffix(quantity);
  if (suffix === '') {
    const num = Number(quantity).valueOf();
    if (isNaN(num)) {
      throw new Error('Unknown quantity ' + quantity);
    }
    return num;
  }
  switch (suffix) {
    case 'n':
      return Number(quantity.substr(0, quantity.length - 1)).valueOf() / 100_000_000.0;
    case 'm':
      return Number(quantity.substr(0, quantity.length - 1)).valueOf() / 1000.0;
    case 'Ki':
      return BigInt(quantity.substr(0, quantity.length - 2)) * BigInt(1024);
    case 'Mi':
      return BigInt(quantity.substr(0, quantity.length - 2)) * BigInt(1024 * 1024);
    case 'Gi':
      return BigInt(quantity.substr(0, quantity.length - 2)) * BigInt(1024 * 1024 * 1024);
    case 'Ti':
      return (
        BigInt(quantity.substr(0, quantity.length - 2)) * BigInt(1024 * 1024 * 1024) * BigInt(1024)
      );
    case 'Pi':
      return (
        BigInt(quantity.substr(0, quantity.length - 2)) *
        BigInt(1024 * 1024 * 1024) *
        BigInt(1024 * 1024)
      );
    case 'Ei':
      return (
        BigInt(quantity.substr(0, quantity.length - 2)) *
        BigInt(1024 * 1024 * 1024) *
        BigInt(1024 * 1024 * 1024)
      );
    default:
      throw new Error(`Unknown suffix: ${suffix}`);
  }
}

export function transComponentDefinitions(componentDefinitions: ComponentDefinitionsBase[]) {
  const defaultCoreDataSource = ['k8s-objects', 'task', 'webservice', 'worker'];
  const cloud: SelectGroupType = [
    {
      label: 'Cloud',
      children: [],
    },
  ];
  const core: SelectGroupType = [
    {
      label: 'Core',
      children: [],
    },
  ];
  const custom: SelectGroupType = [
    {
      label: 'Custom',
      children: [],
    },
  ];
  (componentDefinitions || []).map((item: { name: string; workloadType?: string }) => {
    if (item.workloadType === 'configurations.terraform.core.oam.dev') {
      cloud[0].children.push({
        label: item.name,
        value: item.name,
      });
    } else if (defaultCoreDataSource.includes(item.name)) {
      core[0].children.push({
        label: item.name,
        value: item.name,
      });
    } else {
      custom[0].children.push({
        label: item.name,
        value: item.name,
      });
    }
  });
  return [...core, ...custom, ...cloud];
}

export function getLink(endpointObj: Endpoint) {
  const { appProtocol, host } = endpointObj.endpoint;
  let { port, protocol = '', path = '' } = endpointObj.endpoint;
  protocol = protocol.toLocaleLowerCase();
  if (appProtocol && appProtocol !== '') {
    protocol = appProtocol;
  }
  // Support to open this address in a new window directly.
  if (protocol == 'tcp') {
    protocol = 'http';
  }
  if (host == '') {
    return path;
  }
  if (path === '/') {
    path = '';
  }
  if ((protocol === 'https' && port == 443) || (protocol === 'http' && port === 80)) {
    port = '';
  } else {
    port = ':' + port;
  }
  return protocol + '://' + host + port + path;
}

export function getValue(key: string, value: any): any {
  if (key.indexOf('.') > -1) {
    const currentKey: string = key.substring(0, key.indexOf('.'));
    const nextKey: string = key.substring(key.indexOf('.') + 1);
    return getValue(nextKey, value[currentKey]);
  }
  if (!value) {
    return null;
  }
  return value[key];
}

export function getSelectLabel(
  data: Array<{ name: string; alias?: string }>,
): Array<{ label: string; value: string }> {
  return (data || []).map((item: { name: string; alias?: string }) => {
    return { label: item.alias || item.name, value: item.name };
  });
}

export function getMatchParamObj(match: { params: any }, name: string) {
  return match.params && match.params[name];
}

/**
 * Get browser name agent version
 * return browser name version
 * */
export function getBrowserNameAndVersion() {
  const agent = navigator.userAgent.toLowerCase();
  const regStr_ie = /msie [\d.]+/gi;
  const regStr_ff = /firefox\/[\d.]+/gi;
  const regStr_chrome = /chrome\/[\d.]+/gi;
  const regStr_saf = /safari\/[\d.]+/gi;
  let browserNV: any;
  //IE
  if (agent.indexOf('msie') > 0) {
    browserNV = agent.match(regStr_ie);
  }
  //firefox
  if (agent.indexOf('firefox') > 0) {
    browserNV = agent.match(regStr_ff);
  }
  //Chrome
  if (agent.indexOf('chrome') > 0) {
    browserNV = agent.match(regStr_chrome);
  }
  //Safari
  if (agent.indexOf('safari') > 0 && agent.indexOf('chrome') < 0) {
    browserNV = agent.match(regStr_saf);
  }
  browserNV = browserNV.toString();
  //other
  if ('' == browserNV) {
    browserNV = 'Is not a standard browser';
  }
  //Here does not display "/"
  if (browserNV.indexOf('firefox') != -1 || browserNV.indexOf('chrome') != -1) {
    browserNV = browserNV.replace('/', '');
  }
  //Here does not display space
  if (browserNV.indexOf('msie') != -1) {
    //msie replace IE & trim space
    browserNV = browserNV.replace('msie', 'ie').replace(/\s/g, '');
  }
  //return eg:ie9.0 firefox34.0 chrome37.0
  return browserNV;
}

export function downloadStringFile(content: string, filename: string) {
  const element = document.createElement("a");
  const file = new Blob([content], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
}
