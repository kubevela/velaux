import * as React from 'react';
import * as dagre from 'dagre';

// use the declaration file
import 'dagre-compound';
import type { ResourceTreeNode } from '../../interface/observation';
import './index.less';
import classNames from 'classnames';
import {
  nodeKey,
  describeNode,
  describeCluster,
  describeComponents,
  treeNodeKey,
  getGraphSize,
  getNodeSize,
  ResourceIcon,
} from './utils';
import kubernetes from '../../assets/kubernetes.svg';
import pod from '../../assets/resources/pod.svg';
import kubevela from '../../assets/KubeVela-01.svg';

import { Link } from 'dva/router';
import { Dropdown, Icon, Menu, Tag, Balloon } from '@b-design/ui';
import i18n from '../../i18n';
import { If } from 'tsx-control-statements/components';

type TreeGraphProps = {
  node: TreeNode;
  zoom: number;
  appName: string;
  envName: string;
  graphType: any;
  onNodeClick: (nodeKey: string) => void;
  onResourceDetailClick: (resource: ResourceTreeNode) => void;
};

export interface GraphNode extends TreeNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphEdge {
  points?: { x: number; y: number }[];
  [key: string]: any;
}

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TreeNode {
  resource: ResourceTreeNode;
  nodeType: 'app' | 'cluster' | 'component' | 'trait' | 'policy' | 'resource' | 'pod';
  leafNodes?: TreeNode[];
}

type State = {
  traitsShow: boolean
}

class TreeGraph extends React.Component<TreeGraphProps, State> {
  constructor(props: TreeGraphProps) {
    super(props);
    this.state = {
      traitsShow: false,
    };
  }
  renderComponentNode(props: TreeGraphProps, id: string, node: GraphNode) {
    const fullName = nodeKey(node);
    const traits = node.resource.service.traits
    const labelTraits = traits ? (traits[0].alias ? traits[0].alias + '(' + traits[0].type + ')' : traits[0].type) : undefined
    const graphNode = (
      <div
        key={id}
        onClick={() => props.onNodeClick && props.onNodeClick(fullName)}
        className={classNames('graph-node', 'graph-node-resource', {
          'warning-status': !node.resource.service.healthy,
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
          <ResourceIcon kind={node.resource.componentType.substring(0,1).toUpperCase() || ''} />
        </div>
        <div className={classNames('name')}>
          <div>{node.resource.name}</div>
        </div>
        <div className={classNames('healthy')}>
          <div color={node.resource.service.healthy ? 'green' : 'orange'}>
            <span className={classNames('label-dot')}></span>{node.resource.service.healthy ? 'Healthy' : 'Unhealthy'}
          </div>
        </div>
        <If condition={labelTraits}>
          <div className={classNames('label-traits')}>
            <div>{labelTraits}<span onClick={() =>  {this.setState({ traitsShow: !this.state.traitsShow })}}>{' +' + node.resource.service.traits.length}</span></div>
          </div>
        </If>
        <If condition={labelTraits && this.state.traitsShow}>
          <div style={{top: '20px', position: 'relative'}}>
            {traits.map((trait: any, index: any) => {
              const label = trait.alias ? trait.alias + '(' + trait.type + ')' : trait.type;
              const num = traits.length === 1 ? 0 : Math.trunc(traits.length / 2)
              const nodeY = num === index ? -24 : (-24 + (index - num) * 30)
              return (
                <div
                  key={index}
                  id={label}
                  className={classNames('graph-node')}
                  style={{
                    width: '130px',
                    right: '-168px',
                    padding: '0 0 0 16px',
                    top: nodeY + 'px'
                  }}
                >
                  <div className={classNames('trait')}>
                    <div><span className={classNames('label-dot')} style={{top: '10px', left: '6px'}}></span>{label}</div>
                  </div>
                </div>
              )
            })}
            {traits.map((trait: any, index: any) => {
              const num = traits.length === 1 ? 0 : Math.trunc(traits.length / 2)
              const nodeY = num === index ? 0 : ((index - num) * 30)
              const edgeY = ((index - num) * 15)
              const distance = Math.sqrt(
                Math.pow(30, 2) + Math.pow(nodeY, 2),
              );
              const xmid = num === index || num === index - 1 || num === index + 1 ? 0 : -(Math.abs((num - index) * (15))) + 15
              const angle = (Math.atan2(nodeY, 30) * 180) / Math.PI - 180;
              return (
                <div 
                  className="graph-edge-line-traits"
                  key={index}
                  style={{
                    width: distance + 'px',
                    transform: `translate(${xmid}px, 0) rotate(${angle}deg)`,
                    top: edgeY + 'px',
                  }}
                />
              )
            })}
          </div>
        </If>
      </div>
    );
    return (
      <Balloon trigger={graphNode}>
        <div>
          {describeComponents(node).map((line: any) => {
            return <p className="line">{line}</p>;
          })}
        </div>
      </Balloon>
    );
  }

  renderResourceNode(props: TreeGraphProps, id: string, node: GraphNode) {
    const fullName = nodeKey(node);
    const graphNode = (
      <div
        key={id}
        onClick={() => props.onNodeClick && props.onNodeClick(fullName)}
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
          <Dropdown trigger={<Icon type="ellipsis-vertical" />}>
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
  
  renderAppNode(props: TreeGraphProps, id: string, node: GraphNode) {
    const fullName = nodeKey(node);
  
    const graphNode = (
      <div
        key={id}
        onClick={() => props.onNodeClick && props.onNodeClick(fullName)}
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
          <Dropdown trigger={<Icon type="ellipsis-vertical" />}>
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
  
  renderPodNode(props: TreeGraphProps, id: string, node: GraphNode) {
    const fullName = nodeKey(node);
    const { appName, envName } = props;
    const graphNode = (
      <div
        key={id}
        onClick={() => props.onNodeClick && props.onNodeClick(fullName)}
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
          <Link
            to={`/applications/${appName}/envbinding/${envName}/instances?pod=${node.resource.name}`}
          >
            {node.resource.name}
          </Link>
          <div className={classNames('actions')}>
            <Link
              to={`/applications/${appName}/envbinding/${envName}/logs?pod=${node.resource.name}`}
            >
              <Icon title={i18n.t('Logger')} type="news" />
            </Link>
          </div>
        </div>
        <div className={classNames('actions')}>
          <Dropdown trigger={<Icon type="ellipsis-vertical" />}>
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
  
  renderClusterNode(props: TreeGraphProps, id: string, node: GraphNode) {
    const fullName = nodeKey(node);
  
    const graphNode = (
      <div
        onClick={() => props.onNodeClick && props.onNodeClick(fullName)}
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
  
  setNode(graph: dagre.graphlib.Graph<GraphNode, GraphEdge>, node: TreeNode) {
    const size = getNodeSize(node);
    graph.setNode(treeNodeKey(node), { ...node, width: size.width, height: size.height, x: 0, y: 0 });
  
    node.leafNodes?.map((subNode) => {
      if (treeNodeKey(node) == treeNodeKey(subNode)) {
        return;
      }
      graph.setEdge(treeNodeKey(node), treeNodeKey(subNode), {});
      this.setNode(graph, subNode);
    });
  }

  render() {
    // init the graph
    const { graphType } = this.props
    const graph = new dagre.graphlib.Graph<GraphNode, GraphEdge>();
    graph.setGraph({ nodesep: 50, rankdir: graphType === 'resource-graph' ? 'LR' : 'TB'});

    // set node and make layout
    this.setNode(graph, this.props.node);
    dagre.layout(graph);
  
    const edges: { from: string; to: string; lines: Line[] }[] = [];
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
          width: size.width + 300,
          height: size.height + 150,
          transformOrigin: '0% 0%',
          transform: `scale(${this.props.zoom})`,
        }}
      >
        {graphNodes.map((key) => {
          const node = graph.node(key);
          const nodeType = node.nodeType;
          switch (nodeType) {
            case 'app':
              return <React.Fragment key={key}>{this.renderAppNode(this.props, key, node)}</React.Fragment>;
            case 'cluster':
              return <React.Fragment key={key}>{this.renderClusterNode(this.props, key, node)}</React.Fragment>;
            case 'pod':
              return <React.Fragment key={key}>{this.renderPodNode(this.props, key, node)}</React.Fragment>;
            case 'component':
              return <React.Fragment key={key}>{this.renderComponentNode(this.props, key, node)}</React.Fragment>;
            default:
              return (
                <React.Fragment key={key}>{this.renderResourceNode(this.props, key, node)}</React.Fragment>
              );
          }
        })}
  
        {edges.map((edge) => (
          <div key={`${edge.from}-${edge.to}`} className="graph-edge">
            {edge.lines.map((line, i) => {
              const distance = Math.sqrt(
                Math.pow(line.x1 - line.x2, 2) + Math.pow(line.y1 - line.y2, 2),
              );
              const xMid = (line.x1 + line.x2) / 2;
              const yMid = (line.y1 + line.y2) / 2;
              const angle = (Math.atan2(line.y1 - line.y2, line.x1 - line.x2) * 180) / Math.PI;
              return (
                <div
                  className="graph-edge-line"
                  key={i}
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
}

export default TreeGraph;



