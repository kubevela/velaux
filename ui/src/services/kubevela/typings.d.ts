// @ts-ignore
/* eslint-disable */

declare namespace API {
  export type ApplicationType = {
    name: string;
    desc?: string;
    updatedAt?: number; // unix milliseconds

    components?: ComponentType[];
  };

  export type ComponentType = {
    name: string;
    type?: string;
    properties?: object;
    traits?: TraitType[];
  };

  export type TraitType = {
    type: string;
    properties?: object;
  };

  export type ClusterType = {
    name: string;
    desc?: string;
    updatedAt?: number; // unix milliseconds
    kubeconfig?: string;
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
