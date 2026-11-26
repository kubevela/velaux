export interface SystemInfo {
  systemVersion?: {
    velaVersion: string;
    gitVersion: string;
  };
  installTime: string;
  enableCollection: boolean;
  // capabilities are what the cluster's KubeVela controller can do.
  capabilities?: ControllerCapabilities;
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

// ControllerCapabilities are the features of the cluster's KubeVela controller
// that VelaUX offers only where it has them.
export interface ControllerCapabilities {
  velaCoreVersion?: string;
  reconcileInterval: boolean;
  workflowRestart: boolean;
}
