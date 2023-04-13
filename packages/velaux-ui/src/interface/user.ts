import type { NameAlias } from './env';

export type User = {
  name: string;
  alias?: string;
  email?: string;
  createTime?: string;
  lastLoginTime?: string;
  enable?: boolean;
  password?: string;
  disabled?: boolean;
  roles?: NameAlias[];
};

export interface LoginUserInfo {
  name: string;
  alias?: string;
  email?: string;
  createTime?: string;
  lastLoginTime?: string;
  disabled?: boolean;
  projects: UserProject[];
  platformPermissions?: PermissionBase[];
  projectPermissions?: Record<string, PermissionBase[]>;
}

export interface UserProject {
  name: string;
  alias?: string;
  owner: string;
  joinTime: string;
  roles?: NameAlias[];
}

export interface PermissionBase {
  name: string;
  alias?: string;
  resources?: string[];
  actions: string[];
  effect: string;
  createTime: string;
  updateTime: string;
}

export interface CloudShellPrepare {
  status: string;
  message?: string;
}
