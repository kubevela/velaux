export interface Addon {
  name: string;
  version: string;
  icon: string;
  description: string;
  tags: Array<String>;
  createTime: string;
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
