import React, { Component } from 'react';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';
import { Slider } from '@b-design/ui';
import WorkflowStep from '../WorkflowStep';
import type { WorkflowBase } from '../../../../interface/application';
import './index.less';

type Props = {
  records: WorkflowBase[];
  appName: string;
  loadworkflowRecord: () => {};
};

type State = {
  activeValue: number;
};
class SilderWorkflow extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeValue: 0,
    };
  }

  handleChange = (activeValue: number) => {
    this.setState({ activeValue });
  };

  render() {
    const { records, appName, loadworkflowRecord } = this.props;
    return (
      <div>
        <If condition={!records || (Array.isArray(records) && records.length === 0)}>
          <Empty iconWidth={'30px'} />
        </If>
        <If condition={Array.isArray(records) && records.length !== 0}>
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
                    loadworkflowRecord={loadworkflowRecord}
                  />
                </div>
              );
            })}
          </Slider>
        </If>
      </div>
    );
  }
}

export default SilderWorkflow;
