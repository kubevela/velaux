// @ts-ignore
/* eslint-disable */

declare namespace API {
  export type ClusterType = {
    name: string;
    desc?: string;
    updatedAt?: number; // unix milliseconds
    kubeconfig?: string;
  };

  export type ListClustersResponse = {
    clusters: ClusterType[];
  };

  export type ClusterResponse = {
    cluster: ClusterType;
  };
}
