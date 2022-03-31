export interface IntegrationBase {
  name: string;
  alias?: string;
  definitions: string[];
  description?: string;
}

export interface IntegrationBaseExtends {
  id?: string;
  iconType?: string;
  name: string;
  alias?: string;
  description?: string;
  definitions: string[];
  img?: string;
}

export interface ConfigType {
  configType: string;
}

export interface QueryConfig {
  name: string;
  configType: string;
}

export interface QueryConfigs {
  configType: string;
  page?: number;
  pageSize?: number;
}
