import type { DiagramMakerNodes, DiagramMakerEdges } from 'diagram-maker';

export const WORFLOW_NODE_WIDTH = 120;

export type WorkFlowOption = {
  default: boolean;
  edit: boolean;
};

export type WorkFlowData = {
  appName?: string;
  name: string;
  alias: string;
  description: string;
  option?: WorkFlowOption;
  data?: EdgesAndNodes;
  edit?: boolean;
  default?: boolean;
  envName?: string;
  createTime?: string;
  updateTime?: string;
  steps?: Step[];
  workflowRecord?: any;
};

export interface Step {
  name: string;
  alias?: string;
  type: string;
  description?: string;
  dependsOn?: any;
  properties?: string;
  x?: number;
  y?: number;
}

export interface WorkFlowNodeType {
  // Based on use case or leave empty
  type: string;
  alias?: string;
  dependsOn?: null;
  description?: string;
  name: string;
  properties?: string;
}

export interface WorkFlowEdgeType {
  // Based on use case or leave empty
}

export type EdgesAndNodes = {
  nodes: DiagramMakerNodes<WorkFlowNodeType>;
  edges: DiagramMakerEdges<WorkFlowEdgeType>;
};
