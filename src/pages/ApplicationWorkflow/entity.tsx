import {
  DiagramMaker,
  DiagramMakerData,
  DiagramMakerNode,
  DiagramMakerEdge,
  ConnectorPlacement,
  DiagramMakerNodes,
  DiagramMakerEdges,
  EditorMode,
  VisibleConnectorTypes,
  DiagramMakerPanel,
} from 'diagram-maker';

export const WORFLOW_NODE_WIDTH = 120;

export const WORKFLOW_COMMON_PANNEL = {
  p1: {
    id: 'p1',
    position: {
      x: 1220,
      y: 10,
    },
    size: {
      width: 230,
      height: 280,
    },
  },
  p2: {
    id: 'p2',
    position: {
      x: 10,
      y: 10,
    },
    size: {
      width: 420,
      height: 40,
    },
  },
};

export type WorkFlowOption = {
  enable: boolean;
  default: boolean;
  edit: boolean;
};

export type WorkFlowData = {
  appName: string;
  name: string;
  alias: string;
  description: string;
  option: WorkFlowOption;
  data: EdgesAndNodes;
};

export interface WorkFlowNodeType {
  // Based on use case or leave empty
}

export interface WorkFlowEdgeType {
  // Based on use case or leave empty
}

export type EdgesAndNodes = {
  nodes: DiagramMakerNodes<WorkFlowNodeType>;
  edges: DiagramMakerEdges<WorkFlowEdgeType>;
};
