import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Message } from '@b-design/ui';
import _ from 'lodash';
import type {
  DiagramMakerData,
  DiagramMakerNode,
  DiagramMakerEdge,
  DiagramMakerPanel,
} from 'diagram-maker';
import {
  DiagramMaker,
  ConnectorPlacement,
  EditorMode,
  VisibleConnectorTypes,
  Layout,
  WorkflowLayoutDirection,
} from 'diagram-maker';
import WorkFlowNode from '../workflow-node';
import WorkFlowEdge from '../workflow-edge';
import WorkFlowPannel from '../workflow-panel';
import WorkFlowToolTip from '../workflow-tooltip';
import type { EdgesAndNodes, WorkFlowNodeType, WorkFlowEdgeType } from '../entity';
import { WORKFLOW_COMMON_PANNEL } from '../entity';
import WorkflowForm from './workflow-form';
import 'diagram-maker/dist/diagramMaker.css';
import './index.less';
import { If } from 'tsx-control-statements/components';
import type { NodeItem } from '../workflow-component';

type WorkFlowItemProps = {
  workflowId: string;
  edit?: boolean;
  data: EdgesAndNodes;
  workFlowDefinitions: [];
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
    const platformWidth = this.container.clientWidth;
    const platformHeight = 300;
    const { data, edit } = this.props;
    const basicePlatformConfig = {
      panels: WORKFLOW_COMMON_PANNEL,
      workspace: {
        position: {
          x: 0,
          y: 0,
        },
        scale: 1,
        canvasSize: {
          width: Object.keys(data.nodes).length * 280 + 100,
          height: platformHeight,
        },
        viewContainerSize: {
          width: platformWidth,
          height: platformHeight,
        },
      },
      editor: {
        mode: edit ? EditorMode.DRAG : EditorMode.READ_ONLY,
      },
    };

    const initialData: DiagramMakerData<WorkFlowNodeType, WorkFlowEdgeType> = Object.assign(
      {},
      data,
      basicePlatformConfig,
    );
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
                data={node.consumerData}
                selected={node.diagramMakerData.selected}
                workflowId={this.props.workflowId}
                typeId={node.typeId}
              />,
              container,
            );
          },
          edge: (edge: DiagramMakerEdge<{}>, container: HTMLElement) => {
            ReactDOM.render(<WorkFlowEdge id={edge.id} data={edge.consumerData} />, container);
          },
          destroy: (container: HTMLElement) => {
            ReactDOM.unmountComponentAtNode(container);
          },
          panels: {
            p1: this.renderLeftPannel,
            p2: this.renderTopPannel,
          },
        },
        nodeTypeConfig: {
          both: {
            size: {
              width: 120,
              height: 40,
            },
            visibleConnectorTypes: VisibleConnectorTypes.BOTH,
          },
          start: {
            size: {
              width: 120,
              height: 40,
            },
            visibleConnectorTypes: VisibleConnectorTypes.OUTPUT_ONLY,
          },
          end: {
            size: {
              width: 120,
              height: 40,
            },
            visibleConnectorTypes: VisibleConnectorTypes.INPUT_ONLY,
          },
          switch: {
            size: {
              width: 80,
              height: 80,
            },
            connectorPlacementOverride: ConnectorPlacement.LEFT_RIGHT,
            visibleConnectorTypes: VisibleConnectorTypes.NONE,
          },
        },
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
          dispatch(action);
          if (action.type == 'NODE_CREATE') {
            this.setState({
              currentSelectedNodeData: action.payload,
              visible: true,
            });
          }
        },
      },
      {
        initialData,
        consumerRootReducer: (state: any, action: any) => {
          switch (action.type) {
            case 'UPDATENODE':
              const newNode: any = {};
              newNode[action.payload.id] = action.payload;
              const newNodes = Object.assign({}, state.nodes, newNode);
              const newState = Object.assign({}, state, { nodes: newNodes });
              return newState;
            case 'DELETENODE':
              const { edges } = state;
              const items: string[] = [];
              Object.keys(edges).forEach((key) => {
                const obj = edges[key];
                if (obj.dest == action.payload.id || obj.src == action.payload.id) {
                  items.push(key);
                }
              });
              const newstate = Object.assign({}, state, {
                nodes: _.omit(state.nodes, action.payload.id),
                edges: _.omit(state.edges, items),
              });

              return newstate;
            default:
              return state;
          }
        },
        eventListener: () => {},
      },
    );

    this.diagramMaker.store.subscribe(() => {
      const { nodes } = this.diagramMaker.store.getState();
      let currentNode: any = null;
      Object.keys(nodes).forEach((key) => {
        const obj = nodes[key];
        if (obj && obj.diagramMakerData && obj.diagramMakerData.selected) {
          currentNode = obj;
        }
      });
      if (currentNode) {
        this.setState({
          currentSelectedNodeData: currentNode,
          visible: true,
        });
      }
    });
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

  undo = () => {
    this.diagramMaker.api.undo();
  };

  redo = () => {
    this.diagramMaker.api.redo();
  };

  zoomIn = () => {
    this.diagramMaker.api.zoomIn();
  };

  zoomOut = () => {
    this.diagramMaker.api.zoomOut();
  };

  renderLeftPannel = (
    panel: DiagramMakerPanel,
    state: DiagramMakerData<WorkFlowNodeType, WorkFlowEdgeType>,
    diagramMakerContainer: HTMLElement,
  ) => {
    const { workFlowDefinitions, edit } = this.props;
    const parentContainer = diagramMakerContainer.parentElement;
    if (parentContainer) {
      parentContainer.style.display = 'block';
    }
    if (!edit && parentContainer) {
      parentContainer.style.display = 'none';
      return;
    }
    ReactDOM.render(
      <WorkFlowPannel
        definitions={workFlowDefinitions}
        id={panel.id}
        workflowId={this.props.workflowId}
      />,
      diagramMakerContainer,
    );
  };

  renderTopPannel = (
    panel: DiagramMakerPanel,
    state: DiagramMakerData<WorkFlowNodeType, WorkFlowEdgeType>,
    diagramMakerContainer: HTMLElement,
  ) => {
    ReactDOM.render(
      <WorkFlowToolTip
        id={panel.id}
        edit={this.props.edit}
        undo={this.undo}
        redo={this.redo}
        autoLayout={this.autoLayout}
        zoomIn={this.zoomIn}
        zoomOut={this.zoomOut}
        fit={this.fit}
      />,
      diagramMakerContainer,
    );
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

  openDrawer = () => {
    this.setState({
      visible: true,
    });
  };

  closeDrawer = () => {
    this.blurCurrentNode();
    setTimeout(() => {
      this.setState({
        visible: false,
      });
    });
  };

  blurCurrentNode = () => {
    const { nodes } = this.diagramMaker.store.getState();
    const { currentSelectedNodeData } = this.state;
    let consumerData = nodes[currentSelectedNodeData.id];
    if (consumerData) {
      const diagramMakerData = Object.assign({}, consumerData.diagramMakerData, {
        selected: false,
      });
      consumerData = Object.assign({}, consumerData, { diagramMakerData });
      this.diagramMaker.store.dispatch({
        type: 'UPDATENODE',
        payload: consumerData,
      });
    }
  };

  createOrUpdateNode = (values: any) => {
    const { nodes } = this.diagramMaker.store.getState();
    const { currentSelectedNodeData } = this.state;
    let consumerData = nodes[currentSelectedNodeData.id];
    consumerData = Object.assign({}, consumerData, { consumerData: values });
    this.diagramMaker.store.dispatch({
      type: 'UPDATENODE',
      payload: consumerData,
    });

    this.closeDrawer();
  };

  onDelete = (values: NodeItem) => {
    this.diagramMaker.store.dispatch({
      type: 'DELETENODE',
      payload: {
        id: values.id,
      },
    });
    this.closeDrawer();
  };

  render() {
    const { visible, currentSelectedNodeData } = this.state;
    const { workFlowDefinitions } = this.props;

    return (
      <div>
        <div
          ref={(element: HTMLDivElement) => (this.container = element)}
          className="workflow-item-container"
          id={this.props.workflowId}
        />
        <If condition={visible}>
          <WorkflowForm
            onDelete={() => this.onDelete(currentSelectedNodeData)}
            createOrUpdateNode={this.createOrUpdateNode}
            data={currentSelectedNodeData}
            workFlowDefinitions={workFlowDefinitions}
            closeDrawer={this.closeDrawer}
          />
        </If>
      </div>
    );
  }
}

export default WorkFlowItem;
