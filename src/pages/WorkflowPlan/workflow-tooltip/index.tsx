import React, { Component } from 'react';

import { If } from 'tsx-control-statements/components';
import './index.less';

type Props = {
  id: string;
  data?: any;
  edit?: boolean;
  fit: () => void;
  undo: () => void;
  redo: () => void;
  autoLayout: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
};

type State = {};

class WorkFlowToolTip extends Component<Props, State> {
  constructor(props: any) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  render() {
    const { edit, fit, redo, undo, zoomIn, zoomOut, autoLayout } = this.props;

    return (
      <div className="workflow-tooltip-container">
        <If condition={edit}>
          <div className="tip-btn-container">
            <div className="tip-btn" onClick={zoomOut}>
              缩小
            </div>
            <div className="tip-btn" onClick={zoomIn}>
              放大
            </div>
            <div className="tip-btn" onClick={fit}>
              恢复缩放
            </div>
            <div className="tip-btn" onClick={autoLayout}>
              自动布局
            </div>
            <div className="tip-btn" onClick={undo}>
              撤销
            </div>
            <div className="tip-btn" onClick={redo}>
              重做
            </div>
          </div>
        </If>
      </div>
    );
  }
}

export default WorkFlowToolTip;
