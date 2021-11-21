import React, { Component } from 'react';
import { DiagramMakerComponents } from 'diagram-maker';
import './index.less';
import { Definition } from '../../../interface/addon';

type Props = {
  id: string;
  workflowId: string;
  data?: any;
  definitions: Array<Definition>;
};

type State = {};

class WorkFlowPannel extends Component<Props, State> {
  constructor(props: any) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  render() {
    const { definitions } = this.props;
    return (
      <div className="workflow-pannel-container">
        <div className="hl">步骤类型</div>
        <div className="node-container">
          {definitions.map((item) => {
            return (
              <div
                key={item.name}
                className="node-item"
                data-event-target={true}
                data-draggable={true}
                data-type={DiagramMakerComponents.POTENTIAL_NODE}
                data-id={'both'}
              >
                {item.name}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default WorkFlowPannel;
