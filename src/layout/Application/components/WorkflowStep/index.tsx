import React, { Component } from 'react';
import { Step, Button, Balloon, Icon, Message } from '@b-design/ui';
import {
  resumeApplicationWorkflowRecord,
  rollbackApplicationWorkflowRecord,
  terminateApplicationWorkflowRecord,
} from '../../../../api/application';
import type { WorkflowBase, WorkflowStepItem } from '../../../../interface/application';
import './index.less';
import Translation from '../../../../components/Translation';

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
    const steps = recordItem.steps || [{ phase: '', type: '' }];
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
      value: 'default',
      iconType: '',
    };

    const isAnimate = find && find.value === 'succeeded' ? '' : 'shanshan';

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

  renderTitle(data: WorkflowStepItem) {
    const { name, alias } = data;
    if (
      (typeof alias === 'string' && alias.length > 10) ||
      (typeof name === 'string' && name.length > 10)
    ) {
      return (
        <Balloon
          trigger={<div className="title-long-hidden"> {alias || name}</div>}
          closable={false}
        >
          {alias || name}
        </Balloon>
      );
    } else {
      return <div className="margin-right-20 clolor-333">{alias || name}</div>;
    }
  }

  renderStepItemTitle(data: WorkflowStepItem) {
    const { activeValue, indexValue } = this.props;
    const currentWorkFlow = activeValue === indexValue ? true : false;
    const isSuspend = data.type === 'suspend' ? true : false;
    const isFailed = data.phase === 'failed' ? true : false;
    if (isSuspend && currentWorkFlow) {
      return (
        <Balloon
          className="step-confirm-wraper margin-right-20"
          popupStyle={{ background: '#fff', color: '#000' }}
          visible={isSuspend}
          cache={true}
          trigger={<div>{this.renderTitle(data)}</div>}
          closable={false}
          align="b"
        >
          <div className="step-confirm-content">
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
        </Balloon>
      );
    } else if (isFailed && currentWorkFlow) {
      return (
        <Balloon
          className="step-confirm-wraper"
          style={{ width: '200px' }}
          popupStyle={{ background: '#fff', color: '#000' }}
          visible={isFailed}
          cache={true}
          trigger={<div>{this.renderTitle(data)}</div>}
          closable={false}
          align="b"
        >
          <div className="step-confirm-content">
            <span style={{ color: 'red' }}>{data.message} </span>
          </div>
        </Balloon>
      );
    } else {
      return this.renderTitle(data);
    }
  }

  getWorkFlowStep() {
    const { recordItem } = this.props;
    const steps: WorkflowStepItem[] | undefined = recordItem.steps;
    const successStep = (steps || []).filter(
      (item: WorkflowStepItem) => item.phase === 'succeeded',
    );
    const stepItem = (steps || []).map((item: WorkflowStepItem) => (
      <StepItem key={item.id} title={this.renderStepItemTitle(item)} />
    ));

    return (
      <Step current={successStep.length} animation={false} itemRender={this.itemRender}>
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
