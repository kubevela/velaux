import { Card, Icon } from '@alifd/next';
import React, { Component } from 'react';

import type { WorkflowRecord } from '@velaux/data';
import WorkflowStep from '../WorkflowStep';
import './index.less';
import { Translation } from '../../../../components/Translation';
import { If } from '../../../../components/If';

type Props = {
  records: WorkflowRecord[];
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
    let recordItem: WorkflowRecord = { name: '', namespace: '', workflowName: '' };
    if (Array.isArray(records)) {
      if (records.length - 1 < activeValue || activeValue < 0) {
        recordItem = records[0];
      } else {
        recordItem = records[activeValue];
      }
    }
    if (!recordItem) {
      <Card className="slide-workflow-wrapper" contentHeight={'auto'} />;
    }
    return (
      <Card className="slide-workflow-wrapper" contentHeight={'auto'} id={recordItem.applicationRevision}>
        <div className="slide-header">
          <span className="slide-header-name">
            {recordItem.workflowAlias || recordItem.workflowName}({recordItem.status})
          </span>
          <span className="slide-header-version">
            <Translation>Revision</Translation>: {recordItem.applicationRevision}
          </span>
        </div>

        <If condition={Array.isArray(records) && records.length > 1}>
          <div className="slide-icon-wrapper">
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
      </Card>
    );
  }
}

export default WorkflowSlider;
