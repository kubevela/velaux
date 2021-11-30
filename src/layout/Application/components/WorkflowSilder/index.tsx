import React, { Component } from 'react';
import { Icon } from '@b-design/ui';
import WorkflowStep from '../WorkflowStep';
import type { WorkflowBase } from '../../../../interface/application';
import { If } from 'tsx-control-statements/components';
import './index.less';

type Props = {
  records: WorkflowBase[];
  appName: string;
};

type State = {
  activeValue: number;
  version: string;
  workflowName: string;
  recordItem: WorkflowBase;
};
class WorkflowSilder extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeValue: 0,
      workflowName: this.getWorkFlowName(0),
      version: this.getWorkFlowVersion(0),
      recordItem: props.records[0],
    };
  }

  getWorkFlowName(activeValue: number) {
    const { records } = this.props;
    const { workflowName = ' ', workflowAlias = '' } = records[activeValue] || {};
    return workflowAlias || workflowName;
  }

  getWorkFlowVersion(activeValue: number) {
    const { records } = this.props;
    const { applicationRevision = '' } = records[activeValue] || {};
    return applicationRevision;
  }

  handleChange = () => {
    const { activeValue } = this.state;
    this.setState({
      workflowName: this.getWorkFlowName(activeValue),
      version: this.getWorkFlowVersion(activeValue),
    });
  };

  handleLeftClick = () => {
    const { records } = this.props;
    this.setState(
      {
        activeValue: this.state.activeValue - 1,
      },
      () => {
        const { activeValue } = this.state;
        if (this.state.activeValue < 0) {
          this.setState(
            {
              activeValue: records.length - 1,
              recordItem: records[records.length - 1],
            },
            () => {
              this.handleChange();
            },
          );
        } else {
          this.setState(
            {
              recordItem: records[activeValue],
            },
            () => {
              this.handleChange();
            },
          );
        }
      },
    );
  };

  handleRightClick = () => {
    const { records } = this.props;
    this.setState(
      {
        activeValue: this.state.activeValue + 1,
      },
      () => {
        const { activeValue } = this.state;
        if (activeValue === records.length) {
          this.setState(
            {
              activeValue: 0,
              recordItem: records[0],
            },
            () => {
              this.handleChange();
            },
          );
        } else {
          this.setState(
            {
              recordItem: records[activeValue],
            },
            () => {
              this.handleChange();
            },
          );
        }
      },
    );
  };

  render() {
    const { records, appName } = this.props;
    const { workflowName, version, recordItem, activeValue } = this.state;

    return (
      <div className="slide--workflow-wraper">
        <div className="slide-hearder">
          <span className="slide-hearder-name">{workflowName}</span>
          <span className="slide-hearder-version">{version}</span>
        </div>

        <If condition={Array.isArray(records) && records.length > 1}>
          <div className="slide-icon-wraper">
            <span onClick={this.handleLeftClick}>
              {' '}
              <Icon type="arrow-left" size="xxl" className="arrow-left" />{' '}
            </span>
            <span onClick={this.handleRightClick}>
              {' '}
              <Icon type="arrow-right" size="xxl" className="arrow-right" />{' '}
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

export default WorkflowSilder;
