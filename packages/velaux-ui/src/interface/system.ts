export interface SystemInfo {
  systemVersion?: {
    velaVersion: string;
    gitVersion: string;
  };
  installTime: string;
  enableCollection: boolean;
  loginType?: boolean;
  platformID: string;
  statisticInfo: {
    clusterCount?: string;
    appCount?: string;
    enableAddonList?: Record<string, string>;
    componentDefinitionTopList?: string[];
    traitDefinitionTopList?: string[];
    workflowDefinitionTopList?: string[];
    policyDefinitionTopList?: string[];
    updateTime: string;
  };
  dexUserDefaultProjects?: Array<{
    name: string;
    roles: string[];
  }>;
}

export interface UpdateSystemInfo {
  enableCollection: boolean;
  loginType: 'local' | 'dex';
  velaAddress: string;
  dexUserDefaultProjects?: Array<{
    name: string;
    roles: string[];
  }>;
}

export interface DexConfig {
  clientID: string;
  clientSecret: string;
  issuer: string;
  redirectURL: string;
}
