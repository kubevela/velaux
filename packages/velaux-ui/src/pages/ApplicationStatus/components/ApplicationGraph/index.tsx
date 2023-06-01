import { Button } from '@alifd/next';
import React from 'react';

import { TreeGraph } from '../../../../components/TreeGraph';
import type { TreeNode } from '../../../../components/TreeGraph/interface';
import type {
  ApplicationDetail,
  ApplicationStatus,
  EnvBinding,
  ApplicationComponent,
  ComponentStatus,
 AppliedResource, ResourceTreeNode } from '@velaux/data';

import { ShowResource } from './resource-show';

import './index.less';
import classNames from 'classnames';

import { If } from '../../../../components/If';
import { IoMdAdd } from 'react-icons/io';
import { AiOutlineMinus } from 'react-icons/ai';

type Props = {
  applicationStatus?: ApplicationStatus;
  application?: ApplicationDetail;
  env?: EnvBinding;
  resources: AppliedResource[];
  components?: ApplicationComponent[];
  graphType: 'resource-graph' | 'application-graph';
};

type State = {
  showResource: boolean;
  resource?: ResourceTreeNode;
  zoom: number;
};

class ApplicationGraph extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showResource: false,
      zoom: 1,
    };
  }

  componentDidMount() {}

  convertNodeType(node: ResourceTreeNode) {
    switch (node.kind) {
      case 'Pod':
        return 'pod';
      case 'Component':
        return 'component';
      default:
        return 'resource';
    }
  }

  convertNode(resources: ResourceTreeNode[]): TreeNode[] {
    const tree: TreeNode[] = [];
    resources.map((res) => {
      const node: TreeNode = {
        resource: res,
        nodeType: this.convertNodeType(res),
      };
      if (res.leafNodes) {
        node.leafNodes = this.convertNode(res.leafNodes);
      }
      tree.push(node);
    });
    return tree;
  }

  convertComponentNode(service: ComponentStatus, component?: ApplicationComponent): TreeNode {
    const node: TreeNode = {
      nodeType: 'component',
      resource: {
        name: service.name,
        namespace: service.namespace,
        kind: 'Component',
        component: component,
        cluster: service.cluster,
        service: service,
      },
    };
    return node;
  }

  isLeafNode(componentName: string, component: ApplicationComponent): boolean {
    return component.dependsOn?.includes(componentName) || false;
  }

  // generate the component tree base the dependencies
  generateTree(tree: Map<string, TreeNode>, components: ApplicationComponent[]) {
    tree.forEach((node) => {
      const nodeMap = new Map<string, TreeNode>();
      node.leafNodes?.map((ln) => {
        nodeMap.set(ln.resource.name, ln);
      });
      const deleteNode: string[] = [];
      node.leafNodes?.map((n) => {
        let isTop = true;
        components.map((c) => {
          if (this.isLeafNode(n.resource.name, c)) {
            const parentNode = nodeMap.get(c.name);
            if (parentNode && !parentNode.leafNodes) {
              parentNode.leafNodes = [n];
            } else if (parentNode && parentNode.leafNodes) {
              parentNode.leafNodes.push(n);
            }
            isTop = false;
          }
        });
        if (!isTop) {
          deleteNode.push(n.resource.name);
        }
      });
      node.leafNodes = node.leafNodes?.filter((n) => !deleteNode.includes(n.resource.name));
    });
  }

  buildClusterNode(resources: AppliedResource[], graphType?: string): TreeNode[] {
    const clusterTree: Map<string, TreeNode> = new Map<string, TreeNode>();
    if (graphType === 'resource-graph') {
      resources.map((res) => {
        const cluster = res.cluster || 'local';
        if (!clusterTree.get(cluster)) {
          clusterTree.set(cluster, { resource: { name: cluster }, nodeType: 'cluster' });
        }
        const node = clusterTree.get(cluster);
        if (node) {
          if (res.resourceTree) {
            if (!node.leafNodes) {
              node.leafNodes = this.convertNode([res.resourceTree]);
            } else {
              node.leafNodes = node.leafNodes.concat(this.convertNode([res.resourceTree]));
            }
          }
        }
      });
    } else if (graphType === 'application-graph') {
      const { applicationStatus, components } = this.props;
      const services = (applicationStatus && applicationStatus.services) || [];
      const componentMap = new Map<string, ApplicationComponent>();
      components?.map((com) => {
        componentMap.set(com.name, com);
      });
      services.map((s) => {
        const cluster = s.cluster || 'local';
        const namespace = s.namespace;
        const name = `${cluster}/${namespace}`;
        if (!clusterTree.get(name)) {
          clusterTree.set(name, { resource: { name: name }, nodeType: 'target' });
        }
        const clusterNode = clusterTree.get(name);
        if (clusterNode) {
          const component = componentMap.get(s.name);
          if (!clusterNode.leafNodes) {
            clusterNode.leafNodes = [this.convertComponentNode(s, component)];
          } else {
            clusterNode.leafNodes = clusterNode.leafNodes.concat(this.convertComponentNode(s, component));
          }
        }
      });
      //this.generateTree(clusterTree, components || []);
    }
    const tree: TreeNode[] = [];
    clusterTree.forEach((value: TreeNode) => {
      tree.push(value);
    });
    return tree;
  }

  buildTree(): TreeNode {
    const { resources, env, application, graphType } = this.props;
    const root: TreeNode = {
      nodeType: 'app',
      resource: {
        name: env?.appDeployName || application?.name || '',
        kind: 'Application',
        apiVersion: 'core.oam.dev/v1beta1',
        namespace: env?.appDeployNamespace || '',
      },
      leafNodes: this.buildClusterNode(resources, graphType),
    };
    return root;
  }

  onResourceDetailClick = (resource: ResourceTreeNode) => {
    this.setState({ showResource: true, resource: resource });
  };

  render() {
    const { env, application, graphType } = this.props;
    const { showResource, resource, zoom } = this.state;
    const data = this.buildTree();
    return (
      <div className={classNames('graph-container')}>
        <div className="operation">
          <Button.Group>
            <Button
              onClick={() => {
                this.setState({ zoom: zoom - 0.1 });
              }}
              type="secondary"
              disabled={zoom <= 0.5}
            >
              <AiOutlineMinus />
            </Button>
            <Button
              onClick={() => {
                this.setState({ zoom: zoom + 0.1 });
              }}
              disabled={zoom >= 2}
              type="secondary"
            >
              <IoMdAdd />
            </Button>
          </Button.Group>
        </div>
        <TreeGraph
          onResourceDetailClick={this.onResourceDetailClick}
          appName={application?.name || ''}
          envName={env?.name || ''}
          node={data}
          zoom={zoom}
          nodesep={graphType === 'resource-graph' ? 50 : 80}
        />
        <If condition={showResource && resource}>
          {resource && (
            <ShowResource
              onClose={() => {
                this.setState({ showResource: false, resource: undefined });
              }}
              resource={resource}
            />
          )}
        </If>
      </div>
    );
  }
}

export default ApplicationGraph;
