import React, { Component } from 'react';
import { Slider } from '@b-design/ui';
import WorkflowStep from '../WorkflowStep';
import type { WorkflowBase } from '../../../../interface/application';
import './index.less';

type Props = {
  records: WorkflowBase[];
  appName: string;
};

type State = {
  activeValue: number;
  version: string;
  workflowName: string;
};
class SilderWorkflow extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    console.log('this.props', this.props);
    this.state = {
      activeValue: 0,
      workflowName: this.getWorkFlowName(0),
      version: this.getWorkFlowVersion(0),
    };
  }

  getWorkFlowName(activeValue: number) {
    const { records } = this.props;
    const { name = ' ' } = records[activeValue] || {};
    return name;
  }

  getWorkFlowVersion(activeValue: number) {
    const { records } = this.props;
    const { version = '' } = records[activeValue] || {};
    return version;
  }

  handleChange = (activeValue: number) => {
    this.setState({
      activeValue,
      workflowName: this.getWorkFlowName(activeValue),
      version: this.getWorkFlowVersion(activeValue),
    });
  };

  render() {
    const { records, appName } = this.props;
    const { workflowName, version } = this.state;
    return (
      <div>
        <div className="slide-hearder">
          <span className="slide-hearder-name">{workflowName}</span>
          <span className="slide-hearder-version">{version}</span>
        </div>
        <Slider
          style={{ width: '100%' }}
          className="slide-content"
          arrowSize={'large'}
          arrowPosition={'outer'}
          animation={'fade'}
          dots={false}
          activeIndex={this.state.activeValue}
          onChange={this.handleChange}
        >
          {(records || []).map((item: WorkflowBase, index: number) => {
            return (
              <div key={item.name}>
                <WorkflowStep
                  appName={appName}
                  recordName={item.name}
                  workflowName={item.workflowName}
                  indexValue={index}
                  activeValue={this.state.activeValue}
                  recordItem={item}
                  records={records}
                />
              </div>
            );
          })}
        </Slider>
      </div>
    );
  }
}

export default SilderWorkflow;
