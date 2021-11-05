import React, { Component } from 'react';
import { DiagramMakerComponents } from 'diagram-maker';
import './index.less';
import { If } from 'tsx-control-statements/components';
type Props = {
    id: string,
    typeId?: string,
    workflowId: string,
    selected?: boolean,
    data?: any
};

type State = {

};

class WorkFlowNode extends Component<Props, State> {
    constructor(props: any) {
        super(props);

        this.state = {

        };
    }

    componentDidMount() { }


    render() {

        const { data = {}, selected, id, workflowId, typeId } = this.props;
        return (
            <React.Fragment>

                <If condition={typeId !== 'switch'}>
                    <div className={selected ? 'workflow-node-container active' : 'workflow-node-container'} id={id} workflow-id={workflowId}>
                        {data.alias || data.name || '点击编辑'}
                        <div
                            data-event-target="true"
                            data-dropzone="true"
                            data-type={DiagramMakerComponents.NODE_CONNECTOR}
                            data-id={id}
                        />
                        <div
                            data-event-target="true"
                            data-draggable="true"
                            data-type={DiagramMakerComponents.NODE_CONNECTOR}
                            data-id={id}
                        />
                    </div>
                </If>
                <If condition={typeId === 'switch'}>
                    <div className={selected ? 'workflow-node-container workflow-switch-node-container active' : 'workflow-node-container workflow-switch-node-container'} id={id} workflow-id={workflowId}>
                        <div className="rhombus-container" />
                        <div className="content"> {data.text || '点击编辑'}</div>
                        <div
                            className="start-connector"
                            data-event-target="true"
                            data-dropzone="true"
                            data-type={DiagramMakerComponents.NODE_CONNECTOR}
                            data-id={id}
                        />
                        <div
                            className="end-connector"
                            data-event-target="true"
                            data-draggable="true"
                            data-type={DiagramMakerComponents.NODE_CONNECTOR}
                            data-id={id}
                        />
                    </div>
                </If>
            </React.Fragment>

        );
    }
}

export default WorkFlowNode;
