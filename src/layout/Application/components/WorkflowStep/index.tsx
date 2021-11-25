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
  loadworkflowRecord: () => {};
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
        this.props.loadworkflowRecord();
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
        this.props.loadworkflowRecord();
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

  itemRender = (index: number, status: string) => {
    const { recordItem } = this.props;
    const steps = recordItem.steps || [{ phase: '' }];
    const stepStatus = [
      { name: 'succeeded', value: 'succeeded' },
      { name: 'failed', value: 'failed' },
      { name: 'stopped', value: 'stopped' },
      { name: 'running', value: 'running' },
    ];
    const find = stepStatus.find((item) => item.name === steps[index]['phase']) || {
      value: 'default',
    };
    return (
      <div className={`${find.value} shanshan`}>
        {status === 'finish' ? <Icon type="success" /> : <span>{index + 1}</span>}
      </div>
    );
  };

  renderTitle(data: WorkflowStepItem) {
    const { name } = data;
    if (typeof name === 'string' && name.length > 20) {
      return (
        <Balloon trigger={<div className="title-long-hidden"> {name}</div>} closable={false}>
          {name}
        </Balloon>
      );
    } else {
      return <div>{name}</div>;
    }
  }

  renderStepItemTitle(data: WorkflowStepItem) {
    const { activeValue, indexValue } = this.props;
    const currentWorkFlow = activeValue === indexValue ? true : false;
    const isSuspend = data.type === 'suspend' ? true : false;
    if (isSuspend && currentWorkFlow) {
      return (
        <Balloon
          className="confirm-wraper"
          popupStyle={{ background: '#fff', color: '#000' }}
          visible={isSuspend}
          cache={true}
          trigger={<div>{this.renderTitle(data)}</div>}
          closable={false}
          align="b"
        >
          <div>
            <h5>
              <Translation>Needs review before continuing</Translation>
            </h5>
            <hr />
            <div className="margin-bottom-10">
              <Translation>Please select the action you want to perform</Translation>
            </div>
            <Button size="small" onClick={this.onRollbackApplicationWorkflowRecord}>
              <Translation>Rollback</Translation>
            </Button>
            <Button
              size="small"
              className="margin-left-8"
              onClick={this.onResumeApplicationWorkflowRecord}
            >
              <Translation>Continue</Translation>
            </Button>
            <Button
              size="small"
              className="margin-left-8"
              onClick={this.onTerminateApplicationWorkflowRecord}
            >
              <Translation>Termination</Translation>
            </Button>
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

  render() {
    return <div className="workflow-step-wraper">{this.getWorkFlowStep()}</div>;
  }
}

export default WorkflowStep;
