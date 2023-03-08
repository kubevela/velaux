export interface Cluster {
  name: string;
  kubeConfig: string;
  alias?: string;
  status?: string;
  icon?: string;
  description?: string;
  createTime?: string;
  dashboardURL?: string;
  labels?: {};
  providerInfo?: {
    provider: string;
    clusterID: string;
    clusterName?: string;
    regionID?: string;
    vpcID?: string;
    zoneID?: string;
  };
}

export interface CreateCluster {
  name: string;
  alias?: string;
  icon?: string;
  description?: string;
  dashboardURL?: string;
  kubeConfig: string;
  labels?: {};
}
