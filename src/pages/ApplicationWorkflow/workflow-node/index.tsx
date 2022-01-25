import React, { Component } from 'react';
import { DiagramMakerComponents } from 'diagram-maker';
import './index.less';
import type { WorkflowStep } from '../../../interface/application';
import { Balloon, Icon } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import Translation from '../../../components/Translation';

type Props = {
  id: string;
  typeId?: string;
  workflowId: string;
  selected?: boolean;
  showDetail: (id: string) => void;
  deleteNode: (id: string) => void;
  data?: WorkflowStep;
  editMode?: boolean;
};

type State = {};

class WorkFlowNode extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    const { data, selected, id, workflowId, editMode, typeId } = this.props;
    const showName =
      data && data.name ? (
        data.alias || data.name
      ) : (
        <Translation>Click to config Workflow Step</Translation>
      );
    if (typeId == 'prev' || typeId == 'next') {
      return <React.Fragment />;
    }
    return (
      <React.Fragment>
        <div
          className={selected ? 'workflow-node-container active' : 'workflow-node-container'}
          id={id}
          style={{
            cursor: editMode ? 'pointer' : 'auto',
          }}
          onClick={() => this.props.showDetail(id)}
          workflow-id={workflowId}
        >
          <If condition={editMode}>
            <div className="workflow-step-delete">
              <Balloon
                trigger={
                  <Icon
                    size={14}
                    onClick={(event: any) => {
                      event.stopPropagation();
                      this.props.deleteNode(id);
                    }}
                    type="delete"
                  />
                }
              >
                <Translation>Click to remove Workflow Step</Translation>
              </Balloon>
            </div>
          </If>
          {showName}
          <div className="workflow-step-type">{data?.type}</div>
          <div
            data-event-target="true"
            data-dropzone="false"
            data-type={DiagramMakerComponents.NODE_CONNECTOR}
            data-id={id}
          />
          <div
            data-event-target="true"
            data-draggable="false"
            data-type={DiagramMakerComponents.NODE_CONNECTOR}
            data-id={id}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default WorkFlowNode;
