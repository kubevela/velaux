import { Button, Icon } from '@b-design/ui';
import React from 'react';
import { If } from 'tsx-control-statements/components';
import type { TreeNode } from '../../../../components/TreeGraph';
import { TreeGraph } from '../../../../components/TreeGraph';
import type { ApplicationDetail, EnvBinding } from '../../../../interface/application';
import type { AppliedResource, ResourceTreeNode } from '../../../../interface/observation';
import { ShowResource } from './resource-show';
import './index.less';

type Props = {
  application?: ApplicationDetail;
  env?: EnvBinding;
  resources: AppliedResource[];
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

  buildClusterNode(resources: AppliedResource[]): TreeNode[] {
    const clusterTree: Map<string, TreeNode> = new Map<string, TreeNode>();
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
    const tree: TreeNode[] = [];
    clusterTree.forEach((value: TreeNode) => {
      tree.push(value);
    });
    return tree;
  }

  buildTree(): TreeNode {
    const { resources, env, application } = this.props;
    const root: TreeNode = {
      nodeType: 'app',
      resource: {
        name: env?.appDeployName || application?.name || '',
        kind: 'Application',
        namespace: env?.appDeployNamespace || '',
      },
      leafNodes: this.buildClusterNode(resources),
    };
    return root;
  }

  onResourceDetailClick = (resource: ResourceTreeNode) => {
    this.setState({ showResource: true, resource: resource });
  };

  render() {
    const { env, application } = this.props;
    const { showResource, resource, zoom } = this.state;
    const data = this.buildTree();
    return (
      <div className="graph-container">
        <div className="operation">
          <Button.Group>
            <Button
              onClick={() => {
                this.setState({ zoom: zoom - 0.1 });
              }}
              type="secondary"
              disabled={zoom <= 0.5}
            >
              <Icon type="minus" />
            </Button>
            <Button
              onClick={() => {
                this.setState({ zoom: zoom + 0.1 });
              }}
              disabled={zoom >= 2}
              type="secondary"
            >
              <Icon type="add" />
            </Button>
          </Button.Group>
        </div>
        <TreeGraph
          onResourceDetailClick={this.onResourceDetailClick}
          appName={application?.name || ''}
          envName={env?.name || ''}
          onNodeClick={() => {}}
          node={data}
          zoom={zoom}
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
