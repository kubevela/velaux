import type { ApplicationSourceStatus, DataFlow, SourceConsumer, TraitStatus, ResourceTreeNode } from '@velaux/data';

import type { DependencyItem } from '../../utils/dependencies';

export interface TreeNode {
  resource: ResourceTreeNode;
  nodeType: 'app' | 'cluster' | 'component' | 'trait' | 'policy' | 'resource' | 'pod' | 'target' | 'source' | 'flow';
  leafNodes?: TreeNode[];
  // For a component node: what it depends on and what depends on it.
  dependencies?: DependencyItem[];
  // links are the graph keys of nodes this one feeds outside the tree, and
  // linksFrom those feeding it, drawn dotted: a source's readers, a flow's ends.
  links?: string[];
  linksFrom?: string[];
  // detached are nodes on the graph with no parent in the tree, placed by their
  // links alone: the flows between producers and readers.
  detached?: TreeNode[];
  // For a flow node: what moves along it.
  flow?: DataFlow;
  // For a source node: the binding's status, and its readers with no node here.
  source?: ApplicationSourceStatus;
  readersElsewhere?: SourceConsumer[];
  // For a resource a component applied: that component, and the trait if one did.
  origin?: ResourceOrigin;
}

// ResourceOrigin is the component that applied a resource, its type, and the
// trait that applied it where a trait did, each with its health.
export interface ResourceOrigin {
  component: string;
  type?: string;
  trait?: string;
  // healthy and message are the component's health, where it is reported on
  // the resource's cluster; the trait ones the trait's.
  healthy?: boolean;
  message?: string;
  traitHealthy?: boolean;
  traitPending?: boolean;
  traitMessage?: string;
}

export interface Node {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphNode extends Node, TreeNode {}

export interface TraitGraphNode extends Node {
  trait?: TraitStatus;
}

export interface GraphEdge {
  points?: Array<{ x: number; y: number }>;
  [key: string]: any;
}

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
