import { platformPermissions } from './productionLink';
import { get } from './request';

export function getPlatformPermissions() {
  const url = platformPermissions;
  return get(url, {}).then((res) => res);
}
