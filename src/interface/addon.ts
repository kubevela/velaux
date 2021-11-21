import { UIParam } from './application';

export interface Addon {
  name: string;
  version?: string;
  icon?: string;
  description?: string;
  detail?: string;
  tags?: Array<string>;
  createTime?: string;
  deploy_to?: { control_plane: boolean; runtime_cluster: boolean };
  dependencies?: Array<{ name: string }>;
  definitions?: Array<Definition>;
  uiSchema?: Array<UIParam>;
}

export interface Definition {
  name: string;
  type: string;
  description: string;
}

export interface RegistryGitSource {
  url: string;
  path: string;
  token: string;
}

export interface AddonRegistry {
  name: string;
  git: RegistryGitSource;
}
