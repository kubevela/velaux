import React, { Component } from 'react';
import { Icon } from '@b-design/ui';
import WorkflowStep from '../WorkflowStep';
import type { WorkflowBase } from '../../../../interface/application';
import { If } from 'tsx-control-statements/components';
import './index.less';
import Translation from '../../../../components/Translation';

type Props = {
  records: WorkflowBase[];
  appName: string;
};

type State = {
  activeValue: number;
};
class WorkflowSlider extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeValue: 0,
    };
  }

  handleLeftClick = () => {
    const { records } = this.props;
    const { activeValue } = this.state;
    if (activeValue <= 0) {
      this.setState({
        activeValue: records.length - 1,
      });
    } else {
      this.setState({
        activeValue: activeValue - 1,
      });
    }
  };

  handleRightClick = () => {
    const { records } = this.props;
    const { activeValue } = this.state;
    if (activeValue >= records.length - 1) {
      this.setState({
        activeValue: 0,
      });
    } else {
      this.setState({
        activeValue: activeValue + 1,
      });
    }
  };

  render() {
    const { records, appName } = this.props;
    const { activeValue } = this.state;
    let recordItem: WorkflowBase = { name: '', namespace: '', workflowName: '' };
    if (Array.isArray(records) && records.length - 1 > activeValue) {
      recordItem = records[0];
    } else {
      recordItem = records[activeValue];
    }
    return (
      <div className="slide--workflow-wraper">
        <div className="slide-hearder">
          <span className="slide-hearder-name">
            {recordItem.workflowAlias || recordItem.workflowName}({recordItem.status})
          </span>
          <span className="slide-hearder-version">
            <Translation>Deploy Version</Translation>: {recordItem.applicationRevision}
          </span>
        </div>

        <If condition={Array.isArray(records) && records.length > 1}>
          <div className="slide-icon-wraper">
            <span onClick={this.handleLeftClick}>
              <Icon type="arrow-left" size="xxl" className="arrow-left" />
            </span>
            <span onClick={this.handleRightClick}>
              <Icon type="arrow-right" size="xxl" className="arrow-right" />
            </span>
          </div>
        </If>

        <WorkflowStep
          appName={appName}
          recordName={recordItem.name}
          workflowName={recordItem.workflowName}
          indexValue={0}
          activeValue={activeValue}
          recordItem={recordItem}
          records={records}
        />
      </div>
    );
  }
}

export default WorkflowSlider;
