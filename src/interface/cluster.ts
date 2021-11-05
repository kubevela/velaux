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
