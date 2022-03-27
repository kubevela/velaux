import { get } from './request';
import { platformPermissions } from './productionLink';

export function getPlatformPermissions() {
  const url = platformPermissions;
  return get(url, {}).then((res) => res);
}
