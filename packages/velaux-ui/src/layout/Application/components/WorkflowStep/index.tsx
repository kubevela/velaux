import { Step, Button, Balloon, Icon, Message } from '@alifd/next';
import _ from 'lodash';
import React, { Component } from 'react';

import {
  resumeApplicationWorkflowRecord,
  rollbackApplicationWorkflowRecord,
  terminateApplicationWorkflowRecord,
} from '../../../../api/application';
import { Translation } from '../../../../components/Translation';
import type { WorkflowRecord, WorkflowStepStatus } from '@velaux/data';
import './index.less';
import i18n from '../../../../i18n';
import { If } from '../../../../components/If';

type Props = {
  recordItem: WorkflowRecord;
  activeValue: number;
  indexValue: number;
  appName: string;
  workflowName: string;
  recordName: string;
  records: WorkflowRecord[];
};

const { Item: StepItem } = Step;

type State = {
  hiddenConfirm: boolean;
  rollbackLoading: boolean;
  terminateLoading: boolean;
  resumeLoading: boolean;
};
class WorkflowStep extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      hiddenConfirm: false,
      rollbackLoading: false,
      terminateLoading: false,
      resumeLoading: false,
    };
  }

  componentDidMount() {
    const ele = document.getElementById('stepWorkflow');
    const { recordItem } = this.props;
    const steps = recordItem.steps || [];

    const findIdx = _.findIndex(steps, (item: WorkflowStepStatus) => {
      return item.phase === 'running';
    });

    if (ele && findIdx != -1) {
      ele.scrollLeft = Math.ceil(550 / steps.length) * findIdx;
    }
  }

  shouldComponentUpdate(nextProps: Props): boolean {
    if (nextProps.recordItem.status != this.props.recordItem.status) {
      this.setState({ hiddenConfirm: false });
    }
    return true;
  }

  onResumeApplicationWorkflowRecord = () => {
    const { appName, recordName, workflowName } = this.props;
    const params = {
      appName,
      workflowName,
      recordName,
    };
    this.setState({ resumeLoading: true });
    resumeApplicationWorkflowRecord(params)
      .then((re) => {
        if (re) {
          Message.success('Workflow resumed successfully');
          this.setState({ hiddenConfirm: true });
        }
      })
      .finally(() => {
        this.setState({ resumeLoading: false });
      });
  };

  onRollbackApplicationWorkflowRecord = () => {
    const { appName, recordName, workflowName } = this.props;
    const params = {
      appName,
      workflowName,
      recordName,
    };
    this.setState({ rollbackLoading: true });
    rollbackApplicationWorkflowRecord(params)
      .then((re) => {
        if (re) {
          Message.success(i18n.t('Workflow rollback successfully'));
          this.setState({ hiddenConfirm: true });
        }
      })
      .finally(() => {
        this.setState({ rollbackLoading: false });
      });
  };

  onTerminateApplicationWorkflowRecord = () => {
    const { appName, recordName, workflowName } = this.props;
    const params = {
      appName,
      workflowName,
      recordName,
    };
    this.setState({ terminateLoading: true });
    terminateApplicationWorkflowRecord(params)
      .then((re) => {
        if (re) {
          Message.success('Workflow terminated successfully');
          this.setState({ hiddenConfirm: true });
        }
      })
      .finally(() => {
        this.setState({ terminateLoading: false });
      });
  };

  itemRender = (index: number) => {
    const { recordItem } = this.props;
    const steps = recordItem.steps || [{ id: '', name: '', type: '', phase: '' }];
    const stepStatus = [
      { name: 'succeeded', value: 'succeeded', iconType: 'success' },
      { name: 'failed', value: 'failed', iconType: 'error' },
      { name: 'stopped', value: 'stopped', iconType: 'warning' },
      { name: 'skipped', value: 'stopped', iconType: 'warning' },
      { name: 'running', value: 'running', iconType: '' },
    ];
    const find = stepStatus.find((item) => {
      if (item.name === steps[index].phase) {
        return item;
      }
      return;
    }) || {
      name: '',
      value: 'stopped',
      iconType: '',
    };

    const isAnimate = find && find.value === 'running' ? 'shanshan' : '';

    return (
      <div className={`${find.value} ${isAnimate}`} title={find.name}>
        {find.iconType ? <Icon type={find.iconType} /> : <span>{index + 1}</span>}
      </div>
    );
  };

  renderStepItemTitle(data: WorkflowStepStatus) {
    const isFailedClassName = data.phase === 'failed' ? 'failedTitle' : '';
    const isFailed = data.phase === 'failed' ? true : false;
    const { name, alias } = data;
    if ((typeof alias === 'string' && alias.length >= 10) || (typeof name === 'string' && name.length >= 10)) {
      return (
        <Balloon
          trigger={<div className={`title-long-hidden ${isFailedClassName}`}> {alias || name}</div>}
          closable={true}
        >
          <If condition={isFailed}>{data.message}</If>
          <If condition={!isFailed}>{alias || name}</If>
        </Balloon>
      );
    } else {
      return <div className={`${isFailedClassName} clolor-333`}>{alias || name}</div>;
    }
  }

  renderContent(workflow: WorkflowRecord, data: WorkflowStepStatus, currentStep: boolean) {
    const { hiddenConfirm } = this.state;
    const isSuspend = workflow.status == 'running' && data.type === 'suspend' ? true : false;
    if (isSuspend && currentStep && !hiddenConfirm) {
      const { rollbackLoading, terminateLoading, resumeLoading } = this.state;
      return (
        <div className="step-confirm-wrapper">
          <div className="step-confirm-title">
            <Translation>Needs review before continuing</Translation>
            <Icon style={{ cursor: 'pointer' }} onClick={() => this.setState({ hiddenConfirm: true })} type="close" />
          </div>
          <hr />
          <div className="step-confirm-main">
            <Translation>Please select the action you want to perform.</Translation>
          </div>
          <div className="step-confirm-footer">
            <Button
              type="secondary"
              size="small"
              loading={rollbackLoading}
              className="margin-top-5 margin-left-8"
              onClick={this.onRollbackApplicationWorkflowRecord}
            >
              <Translation>Rollback</Translation>
            </Button>

            <Button
              type="secondary"
              size="small"
              loading={terminateLoading}
              className="margin-top-5 margin-left-8"
              onClick={this.onTerminateApplicationWorkflowRecord}
            >
              <Translation>Terminate</Translation>
            </Button>

            <Button
              type="primary"
              size="small"
              loading={resumeLoading}
              className="margin-top-5 margin-left-8"
              onClick={this.onResumeApplicationWorkflowRecord}
            >
              <Translation>Continue</Translation>
            </Button>
          </div>
        </div>
      );
    }
    return <span />;
  }

  changeFirstClassName(steps: WorkflowStepStatus[] | undefined) {
    const firstItem = (steps && steps[0]) || { phase: '', type: '', name: '', alias: '' };
    const isSuspend = firstItem.type === 'suspend' ? true : false;
    const isFailed = firstItem.phase === 'failed' ? true : false;

    const { name, alias } = firstItem;
    let longTitle = '';
    if ((typeof alias === 'string' && alias.length >= 18) || (typeof name === 'string' && name.length >= 18)) {
      longTitle = 'longTitle';
    }

    if (firstItem.phase && (isSuspend || isFailed)) {
      return `changeStep ${longTitle}`;
    } else {
      return `${longTitle}`;
    }
  }

  getWorkFlowStep() {
    const { recordItem } = this.props;
    const steps: WorkflowStepStatus[] | undefined = recordItem.steps;
    if (steps) {
      let currentStep = steps.length - 1;
      (steps || []).map((item: WorkflowStepStatus, i: number) => {
        if (item.phase != 'succeeded') {
          if (i < currentStep) {
            currentStep = i;
          }
        }
      });
      const stepItem = (steps || []).map((item: WorkflowStepStatus, index: number) => (
        <StepItem
          key={item.id}
          onClick={() => {
            this.setState({ hiddenConfirm: false });
          }}
          title={this.renderStepItemTitle(item)}
          content={this.renderContent(recordItem, item, index == currentStep)}
        />
      ));
      const changeStepClassName = this.changeFirstClassName(steps);

      return (
        <Step
          current={currentStep}
          animation={false}
          itemRender={this.itemRender}
          className={`${changeStepClassName}`}
          id="stepWorkflow"
        >
          {stepItem}
        </Step>
      );
    }
    return;
  }

  onHiddenSlide() {
    const { records = [] } = this.props;
    return records.length === 0 ? 'hiHiddenSlide' : '';
  }

  render() {
    const isHiddenSlide = this.onHiddenSlide();
    const { recordName } = this.props;
    return (
      <div id={recordName} className={`workflow-step-wrapper ${isHiddenSlide}`}>
        {this.getWorkFlowStep()}
      </div>
    );
  }
}

export default WorkflowStep;
