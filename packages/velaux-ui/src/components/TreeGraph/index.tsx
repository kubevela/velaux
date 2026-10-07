import * as dagre from 'dagre';
import * as React from 'react';

// use the declaration file
import 'dagre-compound';
import kubevela from '../../assets/KubeVela-01.svg';
import kubernetes from '../../assets/kubernetes.svg';
import pod from '../../assets/resources/pod.svg';
import i18n from '../../i18n';
import type { ResourceTreeNode } from '@velaux/data';

import './index.less';
import classNames from 'classnames';

import { If } from '../If';

import { ComponentNode } from './component-node';
import type { GraphNode, TreeNode, GraphEdge, ResourceOrigin } from './interface';
import { StatusTooltip, statusTooltipPopupClass } from '../StatusTooltip';
import type { StatusTooltipProps } from '../StatusTooltip';
import {
  clusterTooltip,
  componentOriginTooltip,
  resourceTooltip,
  traitOriginTooltip,
  sourceTooltip,
  targetTooltip,
} from './tooltip';
import { podTone, resourceTone } from './pods';
import { treeNodeKey, getNodeSize, ResourceIcon } from './utils';
import type { Rect } from './layout';
import { edgeOffset, getGraphSize, placeAt, shiftIntoView } from './layout';
import type { RouteEdge, RouteNode } from './orthogonal';
import { lanesNeeded, orthoPath, routeDefaults, routeEdges } from './orthogonal';

import { Link } from 'dva/router';
import { Dropdown, Menu, Tag, Balloon } from '@alifd/next';
import { FaEllipsisV } from 'react-icons/fa';
import { BsArrowReturnRight, BsBox, BsDatabase, BsGearWideConnected } from 'react-icons/bs';

import { StatusBadge } from '../StatusBadge';
import type { Tone } from '../StatusBadge';
import { traitState, traitStateCircle } from '../../utils/status';
import { DefinitionLine, useInUseLabel } from './definition-line';
import { sourcePhaseTone } from '../../pages/ApplicationStatus/components/ApplicationGraph/sources';
import { flowLabels, flowLine } from '../../pages/ApplicationStatus/components/ApplicationGraph/flows';
import { BiTransferAlt } from 'react-icons/bi';
import { HiOutlineNewspaper } from 'react-icons/hi';

type TreeGraphProps = {
  node: TreeNode;
  zoom: number;
  appName: string;
  envName: string;
  nodesep: 50 | number;
  onResourceDetailClick: (resource: ResourceTreeNode) => void;
};

// hoverCard shows a tooltip over the element it wraps.
const hoverCard = (trigger: React.ReactElement, card: StatusTooltipProps) => (
  <Balloon trigger={trigger} closable={false} popupClassName={statusTooltipPopupClass}>
    <StatusTooltip {...card} />
  </Balloon>
);

// HealthDot is the small status dot a trait chip has, for a health that is
// reported; nothing where none is.
const HealthDot = ({ healthy, pending }: { healthy?: boolean; pending?: boolean }) =>
  healthy === undefined && !pending ? null : (
    <span className={classNames('circle', traitStateCircle[traitState({ healthy: !!healthy, pending })])} />
  );

// ResourceOriginLine names the component that applied a resource and, for a
// resource a trait applied, the trait, leading on from it. Each has a hover
// card of its own: the component's type and revision, the trait's revision.
const ResourceOriginLine = ({ origin }: { origin: ResourceOrigin }) => {
  const componentRevision = useInUseLabel('component', origin.type);
  const traitRevision = useInUseLabel('trait', origin.trait);
  return (
    <div className="resource-origin">
      {hoverCard(
        <div className="resource-origin-row">
          <BsBox />
          <span className="resource-origin-component">{origin.component}</span>
          <HealthDot healthy={origin.healthy} />
        </div>,
        componentOriginTooltip(origin, componentRevision)
      )}
      {origin.trait &&
        hoverCard(
          <div className="resource-origin-row resource-origin-trait">
            <BsArrowReturnRight className="resource-origin-lead" />
            <BsGearWideConnected />
            <span className="resource-origin-type">{origin.trait}</span>
            <HealthDot healthy={origin.traitHealthy} pending={origin.traitPending} />
          </div>,
          traitOriginTooltip(origin, traitRevision)
        )}
    </div>
  );
};

// toneCircle is the small status dot for a resource's tone.
const toneCircle: Partial<Record<Tone, string>> = {
  healthy: 'circle-success',
  progressing: 'circle-pending',
  unhealthy: 'circle-failure',
  neutral: 'circle-pending',
};

// renderResourceNode is a resource: its icon, name and kind, and the component
// that applied it. With a component named, the resource's hover card is on its
// icon and name, so the component and trait lines can have their own.
function renderResourceNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const card = resourceTooltip(node.resource);
  const health = node.resource.healthStatus;
  const tone = resourceTone(health?.statusCode);
  const ownCard = (trigger: React.ReactElement) => (node.origin ? hoverCard(trigger, card) : trigger);
  const graphNode = (
    <div
      key={id}
      className={classNames('graph-node', 'graph-node-resource', 'graph-node-edge', `tone-${tone}`)}
      style={{
        ...placeAt(node),
      }}
    >
      {ownCard(
        <div className={classNames('icon')}>
          <ResourceIcon kind={node.resource.kind || ''} />
        </div>
      )}
      <div className={classNames('name')}>
        {ownCard(
          <div>
            <div className="resource-node-name">
              <span>{node.resource.name}</span>
              {health?.statusCode && <span className={classNames('circle', toneCircle[tone])} />}
            </div>
            <div className="kind">{node.resource.kind}</div>
          </div>
        )}
        {node.origin && <ResourceOriginLine origin={node.origin} />}
      </div>
      <div className={classNames('actions')}>
        <Dropdown trigger={<FaEllipsisV />}>
          <Menu>
            <Menu.Item onClick={() => props.onResourceDetailClick(node.resource)}>Detail</Menu.Item>
          </Menu>
        </Dropdown>
      </div>
      <If condition={node.resource.kind === 'Service' && node.resource.additionalInfo?.EIP}>
        <div className={classNames('additional')}>
          <Tag size="small" color="orange">
            EIP: {node.resource.additionalInfo?.EIP}
          </Tag>
        </div>
      </If>
    </div>
  );
  return node.origin ? graphNode : hoverCard(graphNode, card);
}

function renderAppNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const graphNode = (
    <div
      key={id}
      className={classNames('graph-node', 'graph-node-app')}
      style={{
        ...placeAt(node),
      }}
    >
      <div className={classNames('icon')}>
        <img src={kubevela} />
      </div>
      <div className={classNames('name')}>
        <span>{node.resource.name}</span>
      </div>
      <div className={classNames('actions')}>
        <Dropdown trigger={<FaEllipsisV />}>
          <Menu>
            <Menu.Item onClick={() => props.onResourceDetailClick(node.resource)}>Detail</Menu.Item>
          </Menu>
        </Dropdown>
      </div>
    </div>
  );
  return (
    <Balloon trigger={graphNode} closable={false} popupClassName={statusTooltipPopupClass}>
      <StatusTooltip {...resourceTooltip(node.resource)} />
    </Balloon>
  );
}

function renderPodNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const { appName, envName } = props;
  const ready = node.resource.additionalInfo?.Ready;
  const tone = podTone(ready, node.resource.healthStatus?.statusCode);
  const graphNode = (
    <div
      key={id}
      className={classNames('graph-node', 'graph-node-pod', 'graph-node-edge', `tone-${tone}`)}
      style={{
        ...placeAt(node),
      }}
    >
      <div className={classNames('icon')}>
        <img src={pod} />
        <span>Pod</span>
      </div>
      <div className={classNames('name')}>
        <Link to={`/applications/${appName}/envbinding/${envName}/instances?pod=${node.resource.name}`}>
          {node.resource.name}
        </Link>
        <div className={classNames('actions', 'pod-status')}>
          <Link to={`/applications/${appName}/envbinding/${envName}/logs?pod=${node.resource.name}`}>
            <HiOutlineNewspaper title={i18n.t('Logger')} />
          </Link>
          {ready && <StatusBadge tone={tone} label={i18n.t('Ready {{ready}}', { ready })} />}
        </div>
      </div>
      <div className={classNames('actions')}>
        <Dropdown trigger={<FaEllipsisV />}>
          <Menu>
            <Menu.Item onClick={() => props.onResourceDetailClick(node.resource)}>Detail</Menu.Item>
          </Menu>
        </Dropdown>
      </div>
    </div>
  );
  return (
    <Balloon trigger={graphNode} closable={false} popupClassName={statusTooltipPopupClass}>
      <StatusTooltip {...resourceTooltip(node.resource)} />
    </Balloon>
  );
}

function renderClusterNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const graphNode = (
    <div
      className={classNames('graph-node', 'graph-node-cluster')}
      style={{
        ...placeAt(node),
      }}
    >
      <div className="icon">
        <img src={kubernetes} />
      </div>
      <div className={classNames('name')}>
        <div>{node.resource.name}</div>
        <div className="kind">Cluster</div>
      </div>
    </div>
  );
  return (
    <Balloon trigger={graphNode} closable={false} popupClassName={statusTooltipPopupClass}>
      <StatusTooltip {...clusterTooltip(node.resource.name)} />
    </Balloon>
  );
}

function renderTargetNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const graphNode = (
    <div
      className={classNames('graph-node', 'graph-node-cluster')}
      style={{
        ...placeAt(node),
      }}
    >
      <div className="icon">
        <img src={kubernetes} />
      </div>
      <div className={classNames('name')}>
        <div>{node.resource.name}</div>
        <div className="kind">Target</div>
      </div>
    </div>
  );
  return (
    <Balloon trigger={graphNode} closable={false} popupClassName={statusTooltipPopupClass}>
      <StatusTooltip {...targetTooltip(node.resource.name)} />
    </Balloon>
  );
}

// renderSourceNode is a spec.sources binding, drawn like a component: its
// name and phase, then the SourceDefinition resolving it and its revision.
function renderSourceNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const source = node.source;
  const tone = sourcePhaseTone(source?.phase);
  const graphNode = (
    <div
      key={id}
      className={classNames('graph-node', 'graph-node-source', 'graph-node-edge', `tone-${tone}`, {
        'unused-status': source?.phase === 'Unused',
      })}
      style={{
        ...placeAt(node, true),
      }}
    >
      <div className="icon">
        <BsDatabase />
      </div>
      <div className="component-node-body">
        <div className="name">
          <div className="component-node-title">
            <span className="component-node-name">{node.resource.name}</span>
            <StatusBadge tone={tone} label={i18n.t(source?.phase || 'Pending')} />
          </div>
          <DefinitionLine kind="source" type={source?.type} />
        </div>
      </div>
    </div>
  );
  return (
    <Balloon trigger={graphNode} closable={false} popupClassName={statusTooltipPopupClass}>
      {source && <StatusTooltip {...sourceTooltip(source, node.readersElsewhere)} />}
    </Balloon>
  );
}

// renderFlowNode labels a dependency with what moves along it: how many fields
// pass, or none for an order alone; all of them on hover. It sits on its edge,
// centred where the edge is drawn through.
function renderFlowNode(id: string, node: GraphNode) {
  const flow = node.flow;
  if (!flow) {
    return null;
  }
  const lines = flow.items.map((item) => flowLine(item));
  const orderOnly = flow.via === 'dependsOn';
  const graphNode = (
    <div
      key={id}
      className={classNames('graph-node', 'graph-node-flow', `flow-${flow.via}`)}
      style={{
        ...placeAt(node),
      }}
    >
      <BiTransferAlt />
      {!orderOnly && <span className="flow-count">{lines.length}</span>}
    </div>
  );
  return (
    <Balloon trigger={graphNode} closable={false} popupClassName={statusTooltipPopupClass}>
      <StatusTooltip
        title={i18n.t(flowLabels[flow.via]).toString()}
        summary={[
          { key: 'From', value: flow.from.name },
          { key: 'To', value: flow.to.name },
        ]}
        message={orderOnly ? i18n.t('Waits for it to be healthy; no data passes').toString() : undefined}
        sections={
          lines.length === 0
            ? []
            : [
                {
                  title: 'Values',
                  count: lines.length,
                  open: true,
                  content: (
                    <ul className="flow-list">
                      {lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ),
                },
              ]
        }
      />
    </Balloon>
  );
}

function setNode(graph: dagre.graphlib.Graph<GraphNode, GraphEdge>, node: TreeNode) {
  const size = getNodeSize(node);
  graph.setNode(treeNodeKey(node), {
    ...node,
    width: size.width,
    height: size.height,
    x: 0,
    y: 0,
  });

  node.leafNodes?.map((subNode) => {
    if (treeNodeKey(node) == treeNodeKey(subNode)) {
      return;
    }
    graph.setEdge(treeNodeKey(node), treeNodeKey(subNode), {});
    setNode(graph, subNode);
  });
  node.detached?.forEach((sub) => setNode(graph, sub));
}

// setLinks adds each node's links as edges, to nodes the tree put on the graph.
function setLinks(graph: dagre.graphlib.Graph<GraphNode, GraphEdge>, node: TreeNode) {
  const key = treeNodeKey(node);
  (node.links || []).forEach((to) => {
    if (graph.hasNode(to)) {
      graph.setEdge(key, to, { link: true });
    }
  });
  (node.linksFrom || []).forEach((from) => {
    if (graph.hasNode(from)) {
      graph.setEdge(from, key, { link: true });
    }
  });
  node.leafNodes?.forEach((sub) => setLinks(graph, sub));
  node.detached?.forEach((sub) => setLinks(graph, sub));
}

// graphCount numbers each graph drawn, so its arrowheads' ids are its own.
let graphCount = 0;

export const TreeGraph = (props: TreeGraphProps) => {
  const [markerId] = React.useState(() => `graph-${++graphCount}`);
  // rects are the boxes the nodes are drawn as, measured once they are, so
  // edges end on them: a node may grow past the size the layout gave it.
  const [rects, setRects] = React.useState<Record<string, Rect>>({});
  const container = React.useRef<HTMLDivElement>(null);
  // Measures after every render, since any update can resize a box; it sets
  // state only when a measurement changed, so it settles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useLayoutEffect(() => {
    const tree = container.current;
    if (!tree) {
      return;
    }
    // Boxes are measured as drawn on screen, transforms included, back in the
    // graph's own units: the graph itself is scaled by the zoom.
    const origin = tree.getBoundingClientRect();
    const zoom = props.zoom || 1;
    const measured: Record<string, Rect> = {};
    tree.querySelectorAll<HTMLElement>('[data-node-key]').forEach((wrapper) => {
      const box = wrapper.firstElementChild as HTMLElement | null;
      if (box) {
        const r = box.getBoundingClientRect();
        measured[wrapper.dataset.nodeKey || ''] = {
          left: Math.round((r.left - origin.left) / zoom),
          top: Math.round((r.top - origin.top) / zoom),
          width: Math.round(r.width / zoom),
          height: Math.round(r.height / zoom),
        };
      }
    });
    if (JSON.stringify(measured) !== JSON.stringify(rects)) {
      setRects(measured);
    }
  });

  // layOut places every node in columns, left to right, with the given gap
  // between columns.
  const layOut = (ranksep: number) => {
    const laid = new dagre.graphlib.Graph<GraphNode, GraphEdge>();
    laid.setGraph({ nodesep: props.nodesep, ranksep, rankdir: 'LR' });
    // links join nodes across the tree once every node is in it
    setNode(laid, props.node);
    setLinks(laid, props.node);
    dagre.layout(laid);
    shiftIntoView(
      laid.nodes().map((id) => laid.node(id)),
      laid.edges().map((e) => laid.edge(e).points || []),
      20
    );
    return laid;
  };

  // routing is what the edge router needs from a layout: every node's box, as
  // drawn once measured, else as laid out, and its column; and every edge, with
  // the heights the layout kept for it across the columns it skips.
  const routing = (laid: dagre.graphlib.Graph<GraphNode, GraphEdge>) => {
    const centres = Array.from(new Set(laid.nodes().map((k) => Math.round(laid.node(k).x)))).sort((x, y) => x - y);
    const columnOf = (key: string) => centres.indexOf(Math.round(laid.node(key).x));
    const nodes: RouteNode[] = laid.nodes().map((key) => {
      const { left, top, width, height, minHeight } = placeAt(laid.node(key));
      return { key, column: columnOf(key), box: rects[key] || { left, top, width, height: height ?? minHeight ?? 0 } };
    });
    const edges: RouteEdge[] = laid.edges().map((e) => {
      const points = laid.edge(e).points || [];
      const passes: number[] = [];
      for (let c = columnOf(e.v) + 1; c < columnOf(e.w); c++) {
        const nearest = points.reduce((best, p) =>
          Math.abs(p.x - centres[c]) < Math.abs(best.x - centres[c]) ? p : best
        );
        passes.push(nearest.y + edgeOffset.y);
      }
      return { key: `${e.v}->${e.w}`, from: e.v, to: e.w, passes };
    });
    return { nodes, edges };
  };

  // The gap between columns holds a lane for each edge crossing it, with room
  // to leave one column and reach the next.
  const leastGap = 56;
  let graph = layOut(leastGap);
  let routed = routing(graph);
  const gap =
    routeDefaults.leadOut +
    routeDefaults.leadIn +
    routeDefaults.spacing * (lanesNeeded(routed.nodes, routed.edges) + 1);
  if (gap > leastGap) {
    graph = layOut(gap);
    routed = routing(graph);
  }
  const routes = routeEdges(routed.nodes, routed.edges);

  // A flow is a label on its dependency, not a stop: the edges into and out of
  // it are drawn as one, straight through it.
  const flowAt = (key: string) => (graph.node(key)?.nodeType === 'flow' ? graph.node(key) : undefined);
  const edges: Array<{ key: string; path: string; link?: boolean }> = [];
  graph.edges().forEach((edgeInfo) => {
    if (flowAt(edgeInfo.w)) {
      return;
    }
    const flow = flowAt(edgeInfo.v);
    const legs = flow
      ? ((graph.inEdges(edgeInfo.v) || []) as unknown as Array<{ v: string; w: string }>).map((into) => ({
          from: into.v,
          points: [...(routes[`${into.v}->${into.w}`] || []), ...(routes[`${edgeInfo.v}->${edgeInfo.w}`] || [])],
        }))
      : [{ from: edgeInfo.v, points: routes[`${edgeInfo.v}->${edgeInfo.w}`] || [] }];
    legs.forEach(({ from, points }) => {
      edges.push({
        key: `${from}-${edgeInfo.v}-${edgeInfo.w}`,
        path: orthoPath(points, 6),
        link: !!graph.edge(edgeInfo).link && flow?.flow?.via !== 'dependsOn',
      });
    });
  });

  const graphNodes = graph.nodes();

  const size = getGraphSize(graphNodes.map((id) => graph.node(id)));
  // renderNode draws one laid-out node as its type is drawn.
  const renderNode = (key: string) => {
    const node = graph.node(key);
    const nodeType = node.nodeType;
    switch (nodeType) {
      case 'app':
        return <React.Fragment key={key}>{renderAppNode(props, key, node)}</React.Fragment>;
      case 'cluster':
        return <React.Fragment key={key}>{renderClusterNode(props, key, node)}</React.Fragment>;
      case 'target':
        return <React.Fragment key={key}>{renderTargetNode(props, key, node)}</React.Fragment>;
      case 'pod':
        return <React.Fragment key={key}>{renderPodNode(props, key, node)}</React.Fragment>;
      case 'component':
        return <ComponentNode key={key} node={node} showTrait={false} />;
      case 'source':
        return <React.Fragment key={key}>{renderSourceNode(props, key, node)}</React.Fragment>;
      case 'flow':
        return <React.Fragment key={key}>{renderFlowNode(key, node)}</React.Fragment>;
      default:
        return <React.Fragment key={key}>{renderResourceNode(props, key, node)}</React.Fragment>;
    }
  };

  return (
    <div
      ref={container}
      className="graph-tree"
      style={{
        width: size.width + 500,
        height: size.height + 150,
        transformOrigin: '0% 0%',
        transform: `scale(${props.zoom})`,
      }}
    >
      <svg className="graph-edges" width={size.width + 500} height={size.height + 150} aria-hidden="true">
        <defs>
          <marker
            id={`${markerId}-edge`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="graph-edge-head" />
          </marker>
          <marker
            id={`${markerId}-link`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="graph-edge-head graph-edge-head-link" />
          </marker>
        </defs>
        {edges.map((edge) => (
          <path
            key={edge.key}
            d={edge.path}
            className={classNames('graph-edge-path', { 'graph-edge-link': edge.link })}
            markerEnd={`url(#${markerId}-${edge.link ? 'link' : 'edge'})`}
          />
        ))}
      </svg>
      {graphNodes.map((key) => (
        <div key={key} data-node-key={key} className="graph-node-slot">
          {renderNode(key)}
        </div>
      ))}
    </div>
  );
};
