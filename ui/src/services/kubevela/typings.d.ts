// @ts-ignore
/* eslint-disable */

declare namespace API {
  export type ApplicationType = {
    name: string;
    desc?: string;
    updatedAt?: number; // unix milliseconds
    components?: ComponentType[];
    events?: Event[];
  };

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
    desc?: string;
    jsonschema: string;
  };

  export type Event = {
    type: string;
    reason: string;
    age: string;
    message: string;
  }
}
