import React, { Component } from 'react';
import { Step, Button, Balloon, Icon, Message } from '@b-design/ui';
import {
  resumeApplicationWorkflowRecord,
  rollbackApplicationWorkflowRecord,
  terminateApplicationWorkflowRecord,
} from '../../../../api/application';
import type { WorkflowBase, WorkflowStepItem } from '../../../../interface/application';
import _ from 'lodash';
import Translation from '../../../../components/Translation';
import './index.less';

type Props = {
  recordItem: WorkflowBase;
  activeValue: number;
  indexValue: number;
  appName: string;
  workflowName: string;
  recordName: string;
  records: WorkflowBase[];
};

const { Item: StepItem } = Step;
class WorkflowStep extends Component<Props> {
  componentDidMount() {
    const ele = document.getElementById('stepWorkflow');
    const { recordItem } = this.props;
    const steps = recordItem.steps || [{ id: '', name: '', type: '', phase: '' }];

    const findIdx = _.findIndex(steps, (item: WorkflowStepItem) => {
      return item.phase === 'running';
    });

    if (ele && findIdx != -1) {
      ele.scrollLeft = Math.ceil(550 / steps.length) * findIdx;
    }
  }
  onResumeApplicationWorkflowRecord = () => {
    const { appName, recordName, workflowName } = this.props;
    const params = {
      appName,
      workflowName,
      recordName,
    };
    resumeApplicationWorkflowRecord(params).then((re) => {
      if (re) {
        Message.success('operation success');
      }
    });
  };

  onRollbackApplicationWorkflowRecord = () => {
    const { appName, recordName, workflowName } = this.props;
    const params = {
      appName,
      workflowName,
      recordName,
    };
    rollbackApplicationWorkflowRecord(params).then((re) => {
      if (re) {
        Message.success('operation success');
      }
    });
  };

  onTerminateApplicationWorkflowRecord = () => {
    const { appName, recordName, workflowName } = this.props;
    const params = {
      appName,
      workflowName,
      recordName,
    };

    terminateApplicationWorkflowRecord(params).then((re) => {
      if (re) {
        Message.success('operation success');
      }
    });
  };

  itemRender = (index: number) => {
    const { recordItem } = this.props;
    const steps = recordItem.steps || [{ id: '', name: '', type: '', phase: '' }];
    const stepStatus = [
      { name: 'succeeded', value: 'succeeded', iconType: 'success' },
      { name: 'failed', value: 'failed', iconType: 'error' },
      { name: 'stopped', value: 'stopped', iconType: 'warning' },
      { name: 'running', value: 'running', iconType: '' },
    ];
    const find = stepStatus.find((item) => {
      if (item.name === steps[index]['phase'] && steps[index]['type'] !== 'suspend') {
        return item;
      }
    }) || {
      value: 'stopped',
      iconType: '',
    };

    const isAnimate = find && find.value === 'running' ? 'shanshan' : '';

    return (
      <div className={`${find.value} ${isAnimate}`}>
        {find.iconType && steps[index].type !== 'suspend' ? (
          <Icon type={find.iconType} />
        ) : (
          <span>{index + 1}</span>
        )}
      </div>
    );
  };

  renderStepItemTitle(data: WorkflowStepItem) {
    const isFailedClassName = data.phase === 'failed' ? 'failedTitle' : '';

    const { name, alias } = data;
    if (
      (typeof alias === 'string' && alias.length >= 10) ||
      (typeof name === 'string' && name.length >= 10)
    ) {
      return (
        <Balloon
          trigger={<div className={`title-long-hidden ${isFailedClassName}`}> {alias || name}</div>}
          closable={false}
        >
          {alias || name}
        </Balloon>
      );
    } else {
      return <div className={`${isFailedClassName} clolor-333`}>{alias || name}</div>;
    }
  }

  renderContent(data: WorkflowStepItem) {
    const isSuspend = data.type === 'suspend' ? true : false;
    const isFailed = data.phase === 'failed' ? true : false;
    const isPhase = data.phase || '';
    if (isSuspend && isPhase) {
      return (
        <div className="step-confirm-wraper">
          <div className="step-confirm-title">
            <Translation>Needs review before continuing</Translation>
          </div>
          <hr />
          <div className="step-confirm-main">
            <Translation>Please select the action you want to perform</Translation>
          </div>
          <div className="step-confirm-footer">
            <Button
              type="secondary"
              size="small"
              className="margin-top-5 margin-left-8"
              onClick={this.onRollbackApplicationWorkflowRecord}
            >
              <Translation>Rollback</Translation>
            </Button>

            <Button
              type="secondary"
              size="small"
              className="margin-top-5 margin-left-8"
              onClick={this.onTerminateApplicationWorkflowRecord}
            >
              <Translation>Termination</Translation>
            </Button>

            <Button
              type="primary"
              size="small"
              className="margin-top-5 margin-left-8"
              onClick={this.onResumeApplicationWorkflowRecord}
            >
              <Translation>Continue</Translation>
            </Button>
          </div>
        </div>
      );
    } else if (isFailed && isPhase) {
      return (
        <div className="step-confirm-wraper">
          <div className="error-message-content">{data.message} </div>
        </div>
      );
    } else {
      return <div></div>;
    }
  }

  changeFirstClassName(steps: WorkflowStepItem[] | undefined) {
    const firsetItem = (steps && steps[0]) || { phase: '', type: '', name: '', alias: '' };
    const isSuspend = firsetItem.type === 'suspend' ? true : false;
    const isFailed = firsetItem.phase === 'failed' ? true : false;

    const { name, alias } = firsetItem;
    let longTitle = '';
    if (
      (typeof alias === 'string' && alias.length >= 18) ||
      (typeof name === 'string' && name.length >= 18)
    ) {
      longTitle = 'longTitle';
    }

    if (firsetItem.phase && (isSuspend || isFailed)) {
      return `changeStep ${longTitle}`;
    } else {
      return `${longTitle}`;
    }
  }

  getWorkFlowStep() {
    const { recordItem } = this.props;
    const steps: WorkflowStepItem[] | undefined = recordItem.steps;
    const successStep = (steps || []).filter(
      (item: WorkflowStepItem) => item.phase === 'succeeded',
    );
    const stepItem = (steps || []).map((item: WorkflowStepItem) => (
      <StepItem
        key={item.id}
        title={this.renderStepItemTitle(item)}
        content={this.renderContent(item)}
      />
    ));

    const changeStepClassName = this.changeFirstClassName(steps);

    return (
      <Step
        current={successStep.length}
        animation={false}
        itemRender={this.itemRender}
        className={`${changeStepClassName}`}
        id="stepWorkflow"
      >
        {stepItem}
      </Step>
    );
  }

  onHiddenSlide() {
    const { records = [] } = this.props;
    return records.length === 0 ? 'hiHiddenSlide' : '';
  }

  render() {
    const isHiddenSlide = this.onHiddenSlide();
    return <div className={`workflow-step-wraper ${isHiddenSlide}`}>{this.getWorkFlowStep()}</div>;
  }
}

export default WorkflowStep;
