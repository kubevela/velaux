import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import { DiagramMaker, DiagramMakerData, DiagramMakerNode, DiagramMakerEdge, ConnectorPlacement, EditorMode, VisibleConnectorTypes, DiagramMakerPanel, Layout, WorkflowLayoutDirection } from 'diagram-maker';
import WorkFlowNode from '../workflow-node';
import WorkFlowEdge from '../workflow-edge';
import WorkFlowPannel from '../workflow-panel';
import WorkFlowToolTip from '../workflow-tooltip';
import { EdgesAndNodes, WorkFlowNodeType, WorkFlowEdgeType, WORKFLOW_COMMON_PANNEL } from '../entity';
import 'diagram-maker/dist/diagramMaker.css';
import './index.less';

interface WorkFlowItemProps {
    workflowId: string,
    edit?: boolean,
    data: EdgesAndNodes
}


class WorkFlowItem extends Component<WorkFlowItemProps> {
    private diagramMaker!: DiagramMaker<WorkFlowNodeType, WorkFlowEdgeType>;
    private container!: HTMLDivElement;

    constructor(props: WorkFlowItemProps) {
        super(props);
    }
    componentDidMount() {
        const platformWidth = this.container.clientWidth;
        const platformHeight = 300;
        const { data, edit } = this.props;

        const basicePlatformConfig = {
            panels: WORKFLOW_COMMON_PANNEL,
            workspace: {
                position: {
                    x: 0,
                    y: 0
                },
                scale: 1,
                canvasSize: {
                    width: platformWidth,
                    height: platformHeight
                },
                viewContainerSize: {
                    width: platformWidth,
                    height: platformHeight
                }
            },
            editor: {
                mode: edit ? EditorMode.DRAG : EditorMode.READ_ONLY
            },
        }
        const initialData: DiagramMakerData<WorkFlowNodeType, WorkFlowEdgeType> = Object.assign({}, data, basicePlatformConfig);
        this.diagramMaker = new DiagramMaker(
            this.container,
            {
                options: {
                    connectorPlacement: ConnectorPlacement.LEFT_RIGHT,
                    showArrowhead: true
                },
                renderCallbacks: {
                    node: (node: DiagramMakerNode<{}>, container: HTMLElement) => {
                        ReactDOM.render(
                            <WorkFlowNode id={node.id} data={node.consumerData} selected={node.diagramMakerData.selected} workflowId={this.props.workflowId}  typeId={node.typeId}/>,
                            container
                        );
                    },
                    edge: (edge: DiagramMakerEdge<{}>, container: HTMLElement) => {
                        ReactDOM.render(
                            <WorkFlowEdge id={edge.id} data={edge.consumerData} />,
                            container
                        );
                    },
                    destroy: (container: HTMLElement) => {
                        ReactDOM.unmountComponentAtNode(container)
                    },
                    panels: {
                        p1: this.renderTopPannel,
                        p2: this.renderRightPannel
                    }
                },
                nodeTypeConfig: {
                    both: {
                        size: {
                            width: 120,
                            height: 40
                        },
                        visibleConnectorTypes: VisibleConnectorTypes.BOTH,

                    },
                    start: {
                        size: {
                            width: 120,
                            height: 40
                        },
                        visibleConnectorTypes: VisibleConnectorTypes.OUTPUT_ONLY
                    },
                    end: {
                        size: {
                            width: 120,
                            height: 40
                        },
                        visibleConnectorTypes: VisibleConnectorTypes.INPUT_ONLY
                    },
                    switch: {
                        size: {
                            width: 80,
                            height: 80
                        },
                        connectorPlacementOverride: ConnectorPlacement.LEFT_RIGHT,
                        visibleConnectorTypes:  VisibleConnectorTypes.NONE
                    }
                }
            },
            {
                initialData,
                eventListener: (e) => {

                }
            }
        );
    }

    fit = () => {
        // this.diagramMaker.api.fit();
        this.diagramMaker.api.resetZoom();

    }


    autoLayout = () => {
        this.diagramMaker.api.layout({
            layoutType: Layout.WORKFLOW,
            distanceMin: 100,
            direction: WorkflowLayoutDirection.LEFT_RIGHT
        });
    }

    undo = () => {
        this.diagramMaker.api.undo();
    }

    redo = () => {
        this.diagramMaker.api.redo();
    }

    zoomIn = () => {
        this.diagramMaker.api.zoomIn();
    }

    zoomOut = () => {
        this.diagramMaker.api.zoomOut();
    }

    renderTopPannel = (panel: DiagramMakerPanel, state: DiagramMakerData<WorkFlowNodeType, WorkFlowEdgeType>, diagramMakerContainer: HTMLElement) => {
        let parentContainer = diagramMakerContainer.parentElement;
        if (parentContainer) {
            parentContainer.style.display = 'block';
        }
        if (!this.props.edit && parentContainer) {
            parentContainer.style.display = 'none';
        }
        ReactDOM.render(
            <WorkFlowPannel id={panel.id} workflowId={this.props.workflowId} />,
            diagramMakerContainer
        );
    }

    renderRightPannel = (panel: DiagramMakerPanel, state: DiagramMakerData<WorkFlowNodeType, WorkFlowEdgeType>, diagramMakerContainer: HTMLElement) => {
        ReactDOM.render(
            <WorkFlowToolTip id={panel.id}
                edit={this.props.edit}
                undo={this.undo}
                redo={this.redo}
                autoLayout={this.autoLayout}
                zoomIn={this.zoomIn}
                zoomOut={this.zoomOut}
                fit={this.fit} />,
            diagramMakerContainer
        );
    }


    componentWillUnmount = () => {
        this.diagramMaker && this.diagramMaker.destroy();
    }

    componentWillReceiveProps = (nextProps: WorkFlowItemProps) => {
        if (nextProps.edit !== this.props.edit) {
            if (nextProps.edit) {
                this.diagramMaker.api.setEditorMode(EditorMode.DRAG);
            } else {
                this.diagramMaker.api.setEditorMode(EditorMode.READ_ONLY);
            }
        }
    }

    render() {
        return <div ref={(element: HTMLDivElement) => this.container = element} className="workflow-item-container" id={this.props.workflowId} />;
    }
}

export default WorkFlowItem;