import React, { Component } from 'react';

import { If } from 'tsx-control-statements/components';
import Translation from '../../../components/Translation';
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
    const { edit, fit, redo, undo, zoomIn, zoomOut } = this.props;

    return (
      <div className="workflow-tooltip-container">
        <If condition={edit}>
          <div className="tip-btn-container">
            <div className="tip-btn" onClick={zoomOut}>
              <Translation>ZoomOut</Translation>
            </div>
            <div className="tip-btn" onClick={zoomIn}>
              <Translation>ZoomIn</Translation>
            </div>
            <div className="tip-btn" onClick={fit}>
              <Translation>RestoreZoom</Translation>
            </div>
            {/* <div className="tip-btn" onClick={autoLayout}>
              <Translation>AutoLayout</Translation>
            </div> */}
            <div className="tip-btn" onClick={undo}>
              <Translation>Revoke</Translation>
            </div>
            <div className="tip-btn" onClick={redo}>
              <Translation>Redo</Translation>
            </div>
          </div>
        </If>
      </div>
    );
  }
}

export default WorkFlowToolTip;
