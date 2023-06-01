export interface HelmRepo {
  url: string;
  type?: string;
  secretName?: string;
}

export interface ChartVersion {
  name: string;
  version: string;
  description?: string;
  apiVersion: string;
  appVersion: string;
  type?: string;
  urls: string[];
  created: string;
  digest: string;
  icon?: string;
}

export interface ImageInfo {
  info?: {
    architecture: string;
    config?: {
      ArgsEscaped: boolean;
      Cmd: string[];
      Env: string[];
      Labels: Record<string, string>;
      Volumes: Record<string, any>;
      ExposedPorts: Record<string, any>;
    };
    manifest?: {
      config: {
        size: number;
        mediaType: string;
      };
      layers: Array<{
        mediaType: string;
        size: number;
      }>;
    };
    created: string;
    os: string;
    docker_version: string;
    author?: string;
  };
  size: number;
  name: string;
  secretNames?: string[];
  registry: string;
  message?: string;
}

export interface ImageRegistry {
  name?: string;
  secretName: string;
  domain?: string;
}
