import type { Endpoint } from '../interface/observation';
type SelectGroupType = {
  label: string;
  children: { label: string; value: string }[];
}[];

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

export function transComponentDefinitions(componentDefinitions: []) {
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
  (componentDefinitions || []).map((item: { name: string; workloadType: string }) => {
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
  return [...core, ...custom, ...cloud]
};

export function getLink(endpointObj: Endpoint) {
  const { appProtocol, host } = endpointObj.endpoint;
  let { port, protocol = '', path = '' } = endpointObj.endpoint;
  protocol = protocol.toLocaleLowerCase();
  if (appProtocol && appProtocol !== '') {
    protocol = appProtocol;
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
