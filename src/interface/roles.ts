import type { NameAlias } from './env';

export interface RolesBase {
  name: string;
  alias?: string;
  createTime?: string;
  updateTime?: string;
  permissions?: NameAlias[];
}

export interface RolesCreateBase {
  name: string;
  alias?: string;
  permissions: string[];
}
