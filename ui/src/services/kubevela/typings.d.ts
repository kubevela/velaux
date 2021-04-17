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

  export type ComponentDefinition = {
    name: string;
    desc?: string;
  };

  export type TraitDefinition = {
    name: string;
    desc?: string;
  };

  export type ComponentDefinitionsResponse = {
    componentDefinitions: ComponentDefinition[];
  };
  export type TraitDefinitionsResponse = {
    traitDefinitions: ComponentDefinition[];
  };
}
