import { Balloon } from '@b-design/ui';
import React, { Component } from 'react';
import Translation from '../../../components/Translation';

import './index.less';
export interface EdgeData {
  dest: string;
  id: string;
  src: string;
}

type Props = {
  id: string;
  data: EdgeData;
  editMode?: boolean;
  addNode: () => void;
};

type State = {};

class WorkFlowEdge extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    const { editMode } = this.props;
    if (editMode) {
      return (
        <Balloon
          trigger={
            <div onClick={this.props.addNode} className="workflow-edge-container">
              +
            </div>
          }
        >
          <Translation>Click to add Workflow Step</Translation>
        </Balloon>
      );
    }
    return <div />;
  }
}

export default WorkFlowEdge;
