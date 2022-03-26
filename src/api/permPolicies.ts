import { get } from './request';
import { permPolicies } from './productionLink';

export function getPermPolicies() {
  const url = permPolicies;
  return get(url, {}).then((res) => res);
}
