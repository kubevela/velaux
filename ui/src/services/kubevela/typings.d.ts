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
    properties?: {};
    traits?: TraitType[];
  };

  export type TraitType = {
    type: string;
    properties?: {};
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
    jsonschema: string;
  };

  export type TraitDefinition = {
    name: string;
    desc?: string;
    jsonschema: string;
  };

  export type ComponentDefinitionsResponse = {
    componentDefinitions: ComponentDefinition[];
  };
  export type TraitDefinitionsResponse = {
    traitDefinitions: ComponentDefinition[];
  };
}
