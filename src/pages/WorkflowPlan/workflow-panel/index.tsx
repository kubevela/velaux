import React, { Component } from 'react';
import { DiagramMakerComponents } from 'diagram-maker';
import './index.less';

type Props = {
  id: string;
  workflowId: string;
  data?: any;
};

type State = {};

class WorkFlowPannel extends Component<Props, State> {
  constructor(props: any) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  render() {
    const { workflowId } = this.props;
    return (
      <div className="workflow-pannel-container">
        <div className="hl">空白节点</div>
        <div className="node-container">
          <div
            className="node-item"
            data-event-target={true}
            data-draggable={true}
            data-type={DiagramMakerComponents.POTENTIAL_NODE}
            data-id={'start'}
          >
            开始节点
          </div>
          <div
            className="node-item"
            data-event-target={true}
            data-draggable={true}
            data-type={DiagramMakerComponents.POTENTIAL_NODE}
            data-id={'both'}
          >
            普通节点
          </div>

          <div
            className="node-item"
            data-event-target={true}
            data-draggable={true}
            data-type={DiagramMakerComponents.POTENTIAL_NODE}
            data-id={'end'}
          >
            结束节点
          </div>
          <div
            className="node-item"
            data-event-target={true}
            data-draggable={true}
            data-type={DiagramMakerComponents.POTENTIAL_NODE}
            data-id={'switch'}
          >
            分支节点
          </div>
        </div>
        {/* <div className="hl">流程模板</div>
                <div
                    className="node-item"
                    data-event-target={true}
                    data-draggable={true}
                    data-type={DiagramMakerComponents.POTENTIAL_NODE}
                    data-id={'start'}

                >
                    部署到开发环境
                </div>
                <div
                    className="node-item"
                    data-event-target={true}
                    data-draggable={true}
                    data-type={DiagramMakerComponents.POTENTIAL_NODE}
                    data-id={'start'}

                >
                    部署到预发环境
                </div> */}
      </div>
    );
  }
}

export default WorkFlowPannel;
