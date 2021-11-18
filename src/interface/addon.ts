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
  uiSchema?: Array<UIParam>;
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
