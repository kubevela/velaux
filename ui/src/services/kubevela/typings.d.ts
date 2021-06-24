// @ts-ignore
/* eslint-disable */

declare namespace API {
  export type ApplicationType = {
    name: string;
    desc?: string;
    updatedAt?: number; // unix milliseconds
    components?: ComponentType[];
    // events?: Event[];
  };

  export type ApplicationDetailType = {
    name: string;
    desc?: string;
    updatedAt?: number; // unix milliseconds
    components?: ComponentType[];
    events?: Event[];
  }
  export type ComponentType = {
    name: string;
    namespace: string;
    type: string;
    workload: string;
    desc?: string;
    phase?: string;
    health?: boolean;
    properties?: {};
    traits?: TraitType[];
  };

  export type TraitType = {
    type: string;
    desc?: string;
    properties?: {};
  };

  export type ClusterType = {
    name: string;
    desc?: string;
    updatedAt?: number; // unix milliseconds
    kubeconfig?: string;
  };

  export type CapabilityType = {
    name: string;
    namespace: string;
    desc?: string;
    jsonschema: string;
  };

  export type CatalogType = {
    name: string;
    desc?: string;
    updatedAt?: number; // unix milliseconds
    type?: string;
    url?: string;
    token?: string;
  };

  export type CatalogCapabilityType = {
    name: string;
    desc?: string;
    updatedAt?: number; // unix milliseconds
    catalogName: string;
    type: string;
    jsonschema: string;
  };

  export type Event = {
    type: string;
    reason: string;
    age: string;
    message: string;
  }
}
