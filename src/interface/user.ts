import type { ProjectDetail } from './project';

export type User = {
  name: string;
  alias?: string;
  email?: string;
  createTime?: string;
  lastLoginTime?: string;
  enable?: boolean;
  password?: string;
  disabled?: boolean;
};

export interface LoginUserInfo {
  name: string;
  alias?: string;
  email?: string;
  createTime?: string;
  lastLoginTime?: string;
  disabled?: boolean;
  projects: ProjectDetail[];
  platformPermPolicies: PermPolicyBase[];
  projectPermPolicies: Record<string, PermPolicyBase[]>;
}

export interface PermPolicyBase {
  name: string;
  alias?: string;
  resources: string[];
  actions: string[];
  effect: string;
  createTime: string;
  updateTime: string;
}
