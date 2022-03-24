import type { NameAlias } from './env';
export interface Project {
  name: string;
  alias?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  owner?: NameAlias;
}

export interface ProjectBaseCreate {
  name: string;
  alias?: string;
  description?: string;
  owner?: string;
}

export interface ProjectDetail {
  name: string;
  alias?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  owner?: NameAlias;
}
