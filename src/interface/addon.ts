import type { ApplicationStatus, UIParam } from './application';
import type { NameAlias } from './env';

export interface Addon {
  name: string;
  version?: string;
  icon?: string;
  description?: string;
  detail?: string;
  tags?: string[];
  createTime?: string;
  deployTo?: { controlPlane: boolean; runtimeCluster: boolean };
  dependencies?: { name: string }[];
  definitions?: Definition[];
  uiSchema?: UIParam[];
  registryName?: string;
  availableVersions?: string[];
  url?: string;
}

export interface AddonStatus {
  args: any;
  phase: 'disabled' | 'enabled' | 'enabling' | 'suspend' | 'disabling' | '';
  name: string;
  appStatus: ApplicationStatus;
  clusters?: Record<string, AddonClusterInfo>;
  installedVersion: string;
  allClusters?: NameAlias[];
}

export interface AddonClusterInfo {
  domain: string;
  access: string;
  loadBalancerIP: string;
  serviceExternalIP: string;
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

export interface RegistryOssSource {
  end_point: string;
  bucket: string;
  path: string;
}

export interface RegistryHelmSource {
  url: string;
}
export interface AddonRegistry {
  name: string;
  git: RegistryGitSource;
  gitee: RegistryGitSource;
  gitlab: RegistryGitSource & { repo: string };
  oss: RegistryOssSource;
  helm: RegistryHelmSource;
}

export interface AddonBaseStatus {
  name: string;
  phase: 'disabled' | 'enabled' | 'enabling' | 'suspend' | 'disabling';
}
