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
import type { GraphNode, TreeNode, GraphEdge, Line } from './interface';
import {
  describeNode,
  describeCluster,
  treeNodeKey,
  getGraphSize,
  getNodeSize,
  ResourceIcon,
  describeTarget,
} from './utils';

import { Link } from 'dva/router';
import { Dropdown, Menu, Tag, Balloon } from '@alifd/next';
import { FaEllipsisV } from 'react-icons/fa';
import { HiOutlineNewspaper } from 'react-icons/hi';

type TreeGraphProps = {
  node: TreeNode;
  zoom: number;
  appName: string;
  envName: string;
  nodesep: 50 | number;
  onResourceDetailClick: (resource: ResourceTreeNode) => void;
};

function renderResourceNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const graphNode = (
    <div
      key={id}
      className={classNames('graph-node', 'graph-node-resource', {
        'error-status': node.resource.healthStatus?.statusCode == 'UnHealthy',
        'warning-status': node.resource.healthStatus?.statusCode == 'Progressing',
      })}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `translate(-80px, 0px)`,
      }}
    >
      <div className={classNames('icon')}>
        <ResourceIcon kind={node.resource.kind || ''} />
      </div>
      <div className={classNames('name')}>
        <div>{node.resource.name}</div>
        <div className="kind">{node.resource.kind}</div>
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
  return (
    <Balloon trigger={graphNode}>
      <div>
        {describeNode(node).map((line) => {
          return <p className="line">{line}</p>;
        })}
      </div>
    </Balloon>
  );
}

function renderAppNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const graphNode = (
    <div
      key={id}
      className={classNames('graph-node', 'graph-node-app')}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `translate(-60px, 0px)`,
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
    <Balloon trigger={graphNode}>
      <div>
        {describeNode(node).map((line) => {
          return <p className="line">{line}</p>;
        })}
      </div>
    </Balloon>
  );
}

function renderPodNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const { appName, envName } = props;
  const graphNode = (
    <div
      key={id}
      className={classNames('graph-node', 'graph-node-pod', {
        'error-status': node.resource.healthStatus?.statusCode == 'UnHealthy',
        'warning-status': node.resource.healthStatus?.statusCode == 'Progressing',
      })}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `translate(-80px, 0px)`,
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
        <div className={classNames('actions')}>
          <Link to={`/applications/${appName}/envbinding/${envName}/logs?pod=${node.resource.name}`}>
            <HiOutlineNewspaper title={i18n.t('Logger')} />
          </Link>
        </div>
      </div>
      <div className={classNames('actions')}>
        <Dropdown trigger={<FaEllipsisV />}>
          <Menu>
            <Menu.Item onClick={() => props.onResourceDetailClick(node.resource)}>Detail</Menu.Item>
          </Menu>
        </Dropdown>
      </div>
      <div className={classNames('additional')}>
        <Tag size="small" color="orange">
          Ready: {node.resource.additionalInfo?.Ready}
        </Tag>
      </div>
    </div>
  );
  return (
    <Balloon trigger={graphNode}>
      <div>
        {describeNode(node).map((line) => {
          return <p className="line">{line}</p>;
        })}
      </div>
    </Balloon>
  );
}

function renderClusterNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const graphNode = (
    <div
      className={classNames('graph-node', 'graph-node-cluster')}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `translate(-40px, 0px)`,
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
    <Balloon trigger={graphNode}>
      <div>
        {describeCluster(node).map((line) => {
          return <p className="line">{line}</p>;
        })}
      </div>
    </Balloon>
  );
}

function renderTargetNode(props: TreeGraphProps, id: string, node: GraphNode) {
  const graphNode = (
    <div
      className={classNames('graph-node', 'graph-node-cluster')}
      style={{
        left: node.x - 30,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `translate(-40px, 0px)`,
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
    <Balloon trigger={graphNode}>
      <div>
        {describeTarget(node).map((line) => {
          return <p className="line">{line}</p>;
        })}
      </div>
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
}

export const TreeGraph = (props: TreeGraphProps) => {
  // init the graph
  const graph = new dagre.graphlib.Graph<GraphNode, GraphEdge>();
  graph.setGraph({
    nodesep: props.nodesep,
    rankdir: 'LR',
  });

  // set node and make layout
  setNode(graph, props.node);
  dagre.layout(graph);

  const edges: Array<{ from: string; to: string; lines: Line[] }> = [];
  graph.edges().forEach((edgeInfo) => {
    const edge = graph.edge(edgeInfo);
    const lines: Line[] = [];
    if (edge.points && edge.points.length > 1) {
      for (let i = 1; i < edge.points.length; i++) {
        lines.push({
          x1: edge.points[i - 1].x,
          y1: edge.points[i - 1].y,
          x2: edge.points[i].x,
          y2: edge.points[i].y,
        });
      }
    }
    edges.push({
      from: edgeInfo.v,
      to: edgeInfo.w,
      lines: lines,
    });
  });

  const graphNodes = graph.nodes();

  const size = getGraphSize(graphNodes.map((id) => graph.node(id)));
  return (
    <div
      className="graph-tree"
      style={{
        width: size.width + 500,
        height: size.height + 150,
        transformOrigin: '0% 0%',
        transform: `scale(${props.zoom})`,
      }}
    >
      {graphNodes.map((key) => {
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
            return <ComponentNode key={key} node={node} showTrait={true} />;
          default:
            return <React.Fragment key={key}>{renderResourceNode(props, key, node)}</React.Fragment>;
        }
      })}

      {edges.map((edge) => (
        <div key={`${edge.from}-${edge.to}`} className="graph-edge">
          {edge.lines.map((line) => {
            const distance = Math.sqrt(Math.pow(line.x1 - line.x2, 2) + Math.pow(line.y1 - line.y2, 2));
            const xMid = (line.x1 + line.x2) / 2;
            const yMid = (line.y1 + line.y2) / 2;
            const angle = (Math.atan2(line.y1 - line.y2, line.x1 - line.x2) * 180) / Math.PI;
            return (
              <div
                className="graph-edge-line"
                key={'line' + line.x2 + line.y2}
                style={{
                  width: distance,
                  left: xMid - distance / 2,
                  top: yMid,
                  transform: `translate(40px, 30px) rotate(${angle}deg)`,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
