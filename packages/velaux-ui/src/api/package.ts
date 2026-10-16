import { getDomain } from '../utils/common';
import { packages } from './productionLink';
import { get } from './request';

const base = getDomain().APIBASE + packages;

// listPackages lists the Package resources in the cluster, then the packages
// built into KubeVela.
export function listPackages() {
  return get(base, {}).then((res) => res);
}

export function detailPackage(namespace: string, name: string) {
  return get(`${base}/${namespace}/${name}`, {}).then((res) => res);
}

export function detailBuiltinPackage(path: string, variant: string) {
  return get(`${base}/builtin`, { params: { path, variant } }).then((res) => res);
}
