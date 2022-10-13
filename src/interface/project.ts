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

export interface ProjectUser {
  name: string;
  createTime?: string;
  updateTime?: string;
  userRoles: string[];
}

export interface ProjectUserCreate {
  userName: string;
  userRoles: string;
}

export interface ProjectName {
  projectName: string;
}

export interface QueryProjectUser {
  projectName: string;
  userName: string;
}

export interface UserRoles {
  userRoles: string[];
}

export interface QueryProjectRole {
  projectName: string;
  roleName: string;
}

export interface ProjectRole {
  name: string;
  alias?: string;
  permissions: string[];
}

export interface ProjectRoleBase {
  name: string;
  alias?: string;
  createTime?: string;
  updateTime?: string;
  permissions?: NameAlias[];
}

export interface ProjectMember {
  name: string;
  alias?: string;
  createTime?: string;
  updateTime?: string;
  userRoles: string[];
}

export interface ProjectUserQuery {
  projectName: string;
  page: number;
  pageSize: number;
}
