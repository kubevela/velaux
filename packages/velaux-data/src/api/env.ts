export interface CreateEnvRequest {
  name: string;
  alias?: string;
  project: string;
  description?: string;
  targets: string[];
  namespace?: string;
}

export interface Env {
  name: string;
  alias?: string;
  description?: string;
  namespace: string;
  targets?: NameAlias[];
  project: NameAlias;
  createTime?: string;
  updateTime?: string;
}

export interface EnvListResponse {
  envs: Env[];
  total: number;
}

export interface NameAlias {
  name: string;
  alias?: string;
}
