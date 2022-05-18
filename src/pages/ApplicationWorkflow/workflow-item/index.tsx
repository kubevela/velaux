import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { v4 as uuid } from 'uuid';
import { Message } from '@b-design/ui';
import type { DiagramMakerData, DiagramMakerNode, DiagramMakerEdge } from 'diagram-maker';
import {
  DiagramMaker,
  ConnectorPlacement,
  EditorMode,
  VisibleConnectorTypes,
  Layout,
  WorkflowLayoutDirection,
  NodeActions,
} from 'diagram-maker';
import WorkFlowNode from '../workflow-node';
import type { EdgeData } from '../workflow-edge';
import WorkFlowEdge from '../workflow-edge';
import type { EdgesAndNodes, WorkFlowNodeType, WorkFlowEdgeType } from '../entity';
import WorkflowForm from './workflow-form';
import 'diagram-maker/dist/diagramMaker.css';
import './index.less';
import { If } from 'tsx-control-statements/components';
import type { NodeItem } from '../workflow-component';
import type { WorkflowStep } from '../../../interface/application';

type WorkFlowItemProps = {
  workflowId: string;
  edit?: boolean;
  data: EdgesAndNodes;
  workFlowDefinitions: [];
  appName: string;
};

type State = {
  visible: boolean;
  currentSelectedNodeData: any;
};

class WorkFlowItem extends Component<WorkFlowItemProps, State> {
  container: any;
  diagramMaker: any;
  constructor(props: WorkFlowItemProps) {
    super(props);
    this.state = {
      visible: false,
      currentSelectedNodeData: {},
    };
  }
  componentDidMount() {
    if (this.diagramMaker) {
      this.diagramMaker.destroy();
    }
    const { data, edit } = this.props;
    const containerWidth = this.container.clientWidth;
    const nodeWidth = Object.keys(data.nodes).length * 360;
    const basicPlatformConfig = {
      panels: {},
      workspace: {
        position: {
          x: 0,
          y: 0,
        },
        scale: 1,
        canvasSize: {
          width: containerWidth > nodeWidth ? containerWidth : nodeWidth,
          height: 300,
        },
        viewContainerSize: {
          width: containerWidth > nodeWidth ? containerWidth : nodeWidth,
          height: 300,
        },
      },
      editor: {
        mode: edit ? EditorMode.DRAG : EditorMode.READ_ONLY,
      },
    };
    const initialData: DiagramMakerData<WorkFlowNodeType, WorkFlowEdgeType> = Object.assign(
      {},
      data,
      basicPlatformConfig,
    );
    const nodeTypeConfigs: any = {
      prev: {
        size: {
          width: 200,
          height: 80,
        },
        visibleConnectorTypes: VisibleConnectorTypes.OUTPUT_ONLY,
      },
      next: {
        size: {
          width: 200,
          height: 80,
        },
        visibleConnectorTypes: VisibleConnectorTypes.INPUT_ONLY,
      },
      common: {
        size: {
          width: 200,
          height: 80,
        },
        visibleConnectorTypes: VisibleConnectorTypes.BOTH,
      },
    };
    this.diagramMaker = new DiagramMaker(
      this.container,
      {
        options: {
          connectorPlacement: ConnectorPlacement.LEFT_RIGHT,
          showArrowhead: true,
        },
        renderCallbacks: {
          node: (node: DiagramMakerNode<{}>, container: HTMLElement) => {
            ReactDOM.render(
              <WorkFlowNode
                id={node.id}
                data={node.consumerData as WorkflowStep}
                selected={node.diagramMakerData.selected}
                workflowId={this.props.workflowId}
                showDetail={this.showStepDetail}
                editMode={edit}
                deleteNode={this.deleteNode}
                typeId={node.typeId}
              />,
              container,
            );
          },
          edge: (edge: DiagramMakerEdge<{}>, container: HTMLElement) => {
            ReactDOM.render(
              <WorkFlowEdge
                editMode={edit}
                id={edge.id}
                addNode={() => {
                  this.newNode(edge.src);
                }}
                data={edge as EdgeData}
              />,
              container,
            );
          },
          destroy: (container: HTMLElement) => {
            ReactDOM.unmountComponentAtNode(container);
          },
          panels: {},
        },
        nodeTypeConfig: nodeTypeConfigs,
        actionInterceptor: (action: any, dispatch, getState) => {
          const { edges } = getState();
          if (action.type == 'EDGE_CREATE' && action.payload) {
            if (action.payload.src && edges[action.payload.src] && edges[action.payload.src].dest) {
              Message.warning('Process forking is not supported');
              return;
            }
            if (action.payload.dest) {
              for (const key in edges) {
                if (edges[key].dest == action.payload.dest) {
                  Message.warning('Process forking is not supported');
                  return;
                }
              }
            }
          }
          if (action.type == NodeActions.NODE_DRAG) {
            if (action.payload.workspaceRectangle.size.height > 400) {
              this.diagramMaker.api.resetZoom();
            }
          }
          if (action.type == 'DELETE_ITEMS') {
            if (Array.isArray(action.payload.edgeIds) && action.payload.edgeIds.length > 0) {
              Message.warning(
                'If remove the edge and save the workflow, the nodes that after this edge will be removed.',
              );
            }
          }
          dispatch(action);
        },
      },
      {
        initialData,
        consumerRootReducer: (state: any, action: any) => {
          switch (action.type) {
            case 'UPDATE_NODE':
              const newNode: any = {};
              newNode[action.payload.id] = action.payload;
              const newNodes = Object.assign({}, state.nodes, newNode);
              return Object.assign({}, state, { nodes: newNodes });
            case 'UPDATE_NODES':
              return Object.assign({}, state, { nodes: action.payload });
            case 'UPDATE_EDGES':
              return Object.assign({}, state, { edges: action.payload });
            default:
              return state;
          }
        },
        eventListener: () => {},
      },
    );
  }

  fit = () => {
    this.diagramMaker.api.resetZoom();
  };

  autoLayout = () => {
    this.diagramMaker.api.layout({
      layoutType: Layout.WORKFLOW,
      distanceMin: 100,
      direction: WorkflowLayoutDirection.LEFT_RIGHT,
    });
  };

  componentWillReceiveProps = (nextProps: WorkFlowItemProps) => {
    if (nextProps.edit !== this.props.edit) {
      if (nextProps.edit) {
        this.diagramMaker.api.setEditorMode(EditorMode.DRAG);
      } else {
        this.diagramMaker.api.setEditorMode(EditorMode.READ_ONLY);
      }
    }
  };
  getValues = () => {
    const { edges, nodes } = this.diagramMaker.store.getState();
    return { edges, nodes };
  };

  deleteNode = (id: string) => {
    const { edges, nodes } = this.diagramMaker.store.getState();
    const newNodes: any = {};
    const deleteNode = nodes[id];
    if (!deleteNode) {
      return;
    }
    Object.keys(nodes).map((key: string) => {
      if (key == id) {
        return;
      }
      const step: NodeItem = nodes[key];
      let stepNew: NodeItem = Object.assign({}, step);
      if (stepNew.diagramMakerData.position.x >= deleteNode.diagramMakerData.position.x) {
        stepNew = Object.assign(stepNew, {
          diagramMakerData: {
            selected: stepNew.diagramMakerData.selected,
            size: stepNew.diagramMakerData.size,
            position: {
              x: stepNew.diagramMakerData.position.x - 320,
              y: stepNew.diagramMakerData.position.y,
            },
          },
        });
      }
      newNodes[stepNew.id] = stepNew;
    });
    const newEdges: any = {};
    let preEdge: EdgeData = { id: '', dest: '', src: '' };
    let dest = '';
    Object.keys(edges).map((key: string) => {
      const edge: EdgeData = edges[key];
      if (edge.src == id) {
        dest = edge.dest;
        return;
      }
      if (edge.dest == id) {
        preEdge = Object.assign({}, edge);
        return;
      }
      newEdges[key] = edge;
    });
    preEdge.dest = dest;
    newEdges[preEdge.id] = preEdge;
    this.diagramMaker.store.dispatch({
      type: 'UPDATE_NODES',
      payload: newNodes,
    });
    this.diagramMaker.store.dispatch({
      type: 'UPDATE_EDGES',
      payload: newEdges,
    });
  };

  newNode = (source: string) => {
    const { nodes, edges } = this.diagramMaker.store.getState();
    const sourceNode = nodes[source];
    let newNode: NodeItem = Object.assign({}, sourceNode);
    newNode = Object.assign(newNode, {
      consumerData: { name: '', properties: '', type: '' },
      id: uuid(),
      typeId: 'common',
      diagramMakerData: {
        selected: newNode.diagramMakerData.selected,
        size: newNode.diagramMakerData.size,
        position: {
          x: newNode.diagramMakerData.position.x + 320,
          y: newNode.diagramMakerData.position.y,
        },
      },
    });
    const newNodes: any = {};
    Object.keys(nodes).map((key: string) => {
      const step: NodeItem = nodes[key];
      let stepNew: NodeItem = Object.assign({}, step);
      if (stepNew.diagramMakerData.position.x >= newNode.diagramMakerData.position.x) {
        stepNew = Object.assign(stepNew, {
          diagramMakerData: {
            selected: stepNew.diagramMakerData.selected,
            size: stepNew.diagramMakerData.size,
            position: {
              x: stepNew.diagramMakerData.position.x + 320,
              y: stepNew.diagramMakerData.position.y,
            },
          },
        });
      }
      newNodes[stepNew.id] = stepNew;
    });
    newNodes[newNode.id] = newNode;

    const newEdges: any = {};
    Object.keys(edges).map((key: string) => {
      const edge: EdgeData = edges[key];
      if (edge.src == source) {
        const pre = Object.assign({}, edge);
        const next = Object.assign({}, edge);
        pre.dest = newNode.id;
        pre.id = pre.src;
        next.src = newNode.id;
        next.id = next.src;
        newEdges[pre.id] = pre;
        newEdges[next.id] = next;
        return;
      }
      newEdges[key] = edge;
    });

    this.diagramMaker.store.dispatch({
      type: 'UPDATE_NODES',
      payload: newNodes,
    });

    this.diagramMaker.store.dispatch({
      type: 'UPDATE_EDGES',
      payload: newEdges,
    });
    this.setState({
      currentSelectedNodeData: newNode,
      visible: true,
    });
  };

  showStepDetail = (id: string) => {
    const { edit } = this.props;
    if (!edit) {
      return;
    }
    const { nodes } = this.diagramMaker.store.getState();
    const consumerData: NodeItem = nodes[id];
    this.setState({
      currentSelectedNodeData: consumerData,
      visible: true,
    });
  };

  openDrawer = () => {
    this.setState({
      visible: true,
    });
  };

  closeDrawer = () => {
    setTimeout(() => {
      this.setState({
        visible: false,
        currentSelectedNodeData: null,
      });
    });
  };

  createOrUpdateNode = (values: any) => {
    const { nodes } = this.diagramMaker.store.getState();
    const { currentSelectedNodeData } = this.state;
    if (currentSelectedNodeData) {
      let consumerData: NodeItem = nodes[currentSelectedNodeData.id];
      if (consumerData) {
        consumerData = Object.assign({}, consumerData, {
          consumerData: values,
          diagramMakerData: {
            selected: false,
            size: consumerData.diagramMakerData.size,
            position: consumerData.diagramMakerData.position,
          },
        });
        this.diagramMaker.store.dispatch({
          type: 'UPDATE_NODE',
          payload: consumerData,
        });
        this.closeDrawer();
      }
    }
  };

  onDelete = (values: NodeItem) => {
    this.diagramMaker.store.dispatch({
      type: NodeActions.NODE_DELETE,
      payload: {
        id: values.id,
      },
    });
    this.closeDrawer();
  };

  render() {
    const { visible, currentSelectedNodeData } = this.state;
    const { workFlowDefinitions, appName } = this.props;

    return (
      <div>
        <div
          ref={(element: HTMLDivElement) => (this.container = element)}
          className="workflow-item-container"
          id={this.props.workflowId}
        />
        <If condition={visible}>
          <WorkflowForm
            createOrUpdateNode={this.createOrUpdateNode}
            data={currentSelectedNodeData}
            checkStepName={(name: string) => {
              const { nodes } = this.diagramMaker.store.getState();
              let exist = false;
              Object.keys(nodes).map((key) => {
                if (nodes[key].consumerData && nodes[key].consumerData.name == name) {
                  exist = true;
                }
              });
              return exist;
            }}
            workFlowDefinitions={workFlowDefinitions}
            closeDrawer={this.closeDrawer}
            appName={appName}
          />
        </If>
      </div>
    );
  }
}

export default WorkFlowItem;
