import React from 'react';

import type {
  ApplicationDetail,
  Workflow,
  WorkflowRecord,
  WorkflowRecordBase,
  WorkflowStepStatus,
  WorkflowStepBase,
  WorkflowStepInputs,
  WorkflowStepOutputs,
} from '@velaux/data';

import { Button, Tab, Loading, Message, Table } from '@alifd/next';
import Ansi from 'ansi-to-react';
import { connect } from 'dva';

import './index.less';
import { Link, routerRedux } from 'dva/router';
import type { Dispatch } from 'redux';

import {
  resumeApplicationWorkflowRecord,
  rollbackApplicationWorkflowRecord,
  terminateApplicationWorkflowRecord,
} from '../../../../api/application';
import {
  detailWorkflowRecord,
  getWorkflowRecordInputs,
  getWorkflowRecordLogs,
  getWorkflowRecordOutputs,
} from '../../../../api/workflows';
import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import PipelineGraph from '../../../../components/PipelineGraph';
import { groupMode, runMode } from '../../../../components/PipelineGraph/dependencies';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import { convertAny, momentDate, timeDiff } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { StatusBadge } from '../../../../components/StatusBadge';
import { generatedStepProperties } from './status';
import { recordStatus, stepStatus as stepBadge } from '../../../../components/PipelineGraph/status';
import { HiOutlineRefresh } from 'react-icons/hi';
import { AiOutlineClose } from 'react-icons/ai';

type Props = {
  applicationDetail: ApplicationDetail;
  workflow: Workflow;
  recordName: string;
  envName: string;
  dispatch?: Dispatch<any>;
};

type State = {
  zoom: number;
  showDetail: boolean;
  showRecord?: WorkflowRecord;
  stepStatus?: WorkflowStepStatus;
  activeKey: string | number;
  statusLoading: boolean;

  outputLoading?: boolean;
  inputLoading?: boolean;
  outputs?: WorkflowStepOutputs;
  inputs?: WorkflowStepInputs;

  logs?: string[];
  logSource?: string;
  logLoading?: boolean;

  approvingStep?: string;
  terminateLoading?: boolean;
  rollbackLoading?: boolean;
};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationWorkflowRecord extends React.Component<Props, State> {
  loop: boolean;
  disableLoop: boolean;
  constructor(props: Props) {
    super(props);
    this.state = {
      zoom: 1,
      showDetail: false,
      statusLoading: true,
      activeKey: 'detail',
    };
    this.loop = false;
    this.disableLoop = false;
  }

  componentDidMount() {
    this.loadWorkflowRecord();
  }
  componentWillUnmount() {
    this.disableLoop = true;
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.recordName !== this.props.recordName) {
      this.loadWorkflowRecord();
    }
  }

  loadWorkflowRecord = () => {
    const { recordName, workflow, applicationDetail } = this.props;
    this.setState({ statusLoading: true });
    detailWorkflowRecord({
      appName: applicationDetail.name,
      workflowName: workflow.name,
      record: recordName,
    })
      .then((res: WorkflowRecord) => {
        if (res) {
          this.setState({ showRecord: res });
          if (
            res.status &&
            ['terminated', 'failed', 'succeeded'].indexOf(res.status) == -1 &&
            !this.loop &&
            !this.disableLoop
          ) {
            this.loop = true;
            window.setTimeout(() => {
              this.loop = false;
              this.loadWorkflowRecord();
            }, 3000);
          }
        }
      })
      .finally(() => {
        this.setState({ statusLoading: false });
      });
  };

  onStepClick = (step: WorkflowStepStatus) => {
    this.setState({ showDetail: true, stepStatus: step }, () => {
      const { activeKey } = this.state;
      this.onTabChange(activeKey);
    });
  };

  onTabChange = (key: string | number) => {
    const { stepStatus } = this.state;
    this.setState({ activeKey: key });
    if (key == 'outputs' && stepStatus) {
      this.onGetStepOutput();
    }
    if (key == 'detail' && stepStatus) {
      this.onGetStepLog();
    }
    if (key == 'inputs' && stepStatus) {
      this.onGetStepInput();
    }
  };

  onGetStepOutput = () => {
    const { applicationDetail, workflow, recordName } = this.props;
    const { stepStatus } = this.state;
    if (stepStatus) {
      this.setState({ outputLoading: true });
      getWorkflowRecordOutputs({
        appName: applicationDetail.name,
        workflowName: workflow.name,
        record: recordName,
        step: stepStatus?.name,
      })
        .then((res) => {
          const outputs: WorkflowStepOutputs | undefined =
            res && Array.isArray(res.outputs) && res.outputs.length > 0 ? res.outputs[0] : undefined;
          this.setState({
            outputs: outputs,
          });
        })
        .finally(() => {
          this.setState({ outputLoading: false });
        });
    }
  };

  onGetStepLog = () => {
    const { applicationDetail, workflow, recordName } = this.props;
    const { stepStatus } = this.state;
    if (stepStatus) {
      this.setState({ logLoading: true });
      getWorkflowRecordLogs({
        appName: applicationDetail.name,
        workflowName: workflow.name,
        record: recordName,
        step: stepStatus?.name,
      })
        .then((res: { log: string; source: string }) => {
          this.setState({ logs: res && res.log ? res.log.split('\n') : [], logSource: res.source });
        })
        .finally(() => {
          this.setState({ logLoading: false });
        });
    }
  };

  onGetStepInput = () => {
    const { applicationDetail, workflow, recordName } = this.props;
    const { stepStatus } = this.state;
    if (stepStatus) {
      this.setState({ inputLoading: true });
      getWorkflowRecordInputs({
        appName: applicationDetail.name,
        workflowName: workflow.name,
        record: recordName,
        step: stepStatus?.name,
      })
        .then((res) => {
          const input: WorkflowStepInputs | undefined =
            res && Array.isArray(res.inputs) && res.inputs.length > 0 ? res.inputs[0] : undefined;
          this.setState({
            inputs: input,
          });
        })
        .finally(() => {
          this.setState({ inputLoading: false });
        });
    }
  };

  onApproveStep = (step: WorkflowStepStatus) => {
    const { applicationDetail, workflow, recordName } = this.props;
    this.setState({ approvingStep: step.id });
    resumeApplicationWorkflowRecord({
      appName: applicationDetail.name,
      workflowName: workflow.name,
      recordName,
      step: step.name,
    })
      .then((re) => {
        if (re) {
          Message.success(i18n.t('Step approved'));
          this.loadWorkflowRecord();
        }
      })
      .finally(() => {
        this.setState({ approvingStep: undefined });
      });
  };

  // renderStepActions are a waiting step's choices: roll the run back, end it,
  // or approve the step so the run continues.
  renderStepActions = (step: WorkflowStepStatus) => {
    const { rollbackLoading, terminateLoading, approvingStep } = this.state;
    return (
      <>
        <Button
          size="small"
          loading={rollbackLoading}
          title={i18n.t('Rollback to last ready revision').toString()}
          onClick={this.onRollbackApplicationWorkflowRecord}
        >
          <Translation>Rollback</Translation>
        </Button>
        <Button
          size="small"
          warning
          loading={terminateLoading}
          title={i18n.t('Terminate this workflow').toString()}
          onClick={this.onTerminateApplicationWorkflowRecord}
        >
          <Translation>Terminate</Translation>
        </Button>
        <Button
          size="small"
          type="primary"
          loading={approvingStep === step.id}
          title={i18n.t('Approve this step and continue the workflow').toString()}
          onClick={() => this.onApproveStep(step)}
        >
          <Translation>Approve</Translation>
        </Button>
      </>
    );
  };

  onRollbackApplicationWorkflowRecord = () => {
    const { applicationDetail, workflow, recordName, dispatch, envName } = this.props;
    const params = {
      appName: applicationDetail.name,
      workflowName: workflow.name,
      recordName,
    };
    this.setState({ rollbackLoading: true });
    rollbackApplicationWorkflowRecord(params)
      .then((re: WorkflowRecordBase) => {
        if (re) {
          Message.success(i18n.t('Workflow rollback successfully'));
          if (dispatch && re.name) {
            dispatch(
              routerRedux.push(
                `/applications/${applicationDetail.name}/envbinding/${envName}/workflow/records/${re.name}`
              )
            );
          }
        }
      })
      .finally(() => {
        this.setState({ rollbackLoading: false });
      });
  };

  onTerminateApplicationWorkflowRecord = () => {
    const { applicationDetail, workflow, recordName } = this.props;
    const params = {
      appName: applicationDetail.name,
      workflowName: workflow.name,
      recordName,
    };
    this.setState({ terminateLoading: true });
    terminateApplicationWorkflowRecord(params)
      .then((re) => {
        if (re) {
          Message.success(i18n.t('Workflow terminated successfully'));
          this.loadWorkflowRecord();
        }
      })
      .finally(() => {
        this.setState({ terminateLoading: false });
      });
  };

  render() {
    const { workflow, applicationDetail } = this.props;
    const {
      statusLoading,
      zoom,
      showRecord,
      showDetail,
      stepStatus,
      logLoading,
      logSource,
      logs,
      inputs,
      inputLoading,
      outputs,
      outputLoading,
    } = this.state;

    let stepSpec: WorkflowStepBase | undefined;
    workflow?.steps?.map((step) => {
      if (stepStatus && step.name == stepStatus.name) {
        stepSpec = step;
      }
      step.subSteps?.map((sub) => {
        if (stepStatus && sub.name == stepStatus.name) {
          stepSpec = sub;
        }
      });
    });
    let properties = stepSpec && stepSpec.properties;
    if (typeof properties === 'string') {
      properties = JSON.parse(properties) as Record<string, any>;
    }
    const generated = generatedStepProperties(workflow, stepStatus);
    const status = recordStatus(showRecord?.status);
    const failed = showRecord?.status === 'failed' || showRecord?.status === 'terminated';

    return (
      <div className="wf-run">
        <div className="wf-run-summary">
          <div className="wf-run-head">
            <StatusBadge tone={status.tone} label={status.label} />
            <span className="wf-run-name">{showRecord?.name}</span>
            <Button
              className="wf-run-refresh"
              text
              loading={statusLoading}
              title={i18n.t('Refresh').toString()}
              onClick={() => this.loadWorkflowRecord()}
            >
              <HiOutlineRefresh />
            </Button>
          </div>
          <dl className="wf-run-meta">
            <div>
              <dt>
                <Translation>Started</Translation>
              </dt>
              <dd>{momentDate(showRecord?.startTime) || '-'}</dd>
            </div>
            <div>
              <dt>
                <Translation>Duration</Translation>
              </dt>
              <dd>{timeDiff(showRecord?.startTime, showRecord?.endTime) || '-'}</dd>
            </div>
            <div>
              <dt>
                <Translation>Mode</Translation>
              </dt>
              <dd>{showRecord?.mode || 'StepByStep-DAG'}</dd>
            </div>
            <div>
              <dt>
                <Translation>Revision</Translation>
              </dt>
              <dd>
                <Link to={`/applications/${applicationDetail.name}/revisions`}>
                  {showRecord?.applicationRevision || '-'}
                </Link>
              </dd>
            </div>
          </dl>
          <If condition={showRecord?.message}>
            <Message type={failed ? 'error' : 'notice'} className="wf-run-message">
              {showRecord?.message}
            </Message>
          </If>
        </div>

        <div className="wf-run-body">
          <div className="wf-run-canvas" onClick={() => this.setState({ showDetail: false })}>
            <div className="wf-run-hint">
              <Translation>Select a step to see its details</Translation>
            </div>
            {showRecord && (
              <PipelineGraph
                name={`${showRecord?.name}`}
                spec={workflow?.steps}
                mode={runMode(showRecord?.mode, workflow?.mode)}
                subMode={groupMode(undefined, showRecord?.mode, workflow?.subMode)}
                zoom={zoom}
                selected={showDetail ? stepStatus?.id : undefined}
                actions={this.renderStepActions}
                onNodeClick={this.onStepClick}
                steps={showRecord?.steps}
              />
            )}
          </div>
          <If condition={showDetail && stepStatus}>
            <div className="wf-step-panel" onClick={(event) => event.stopPropagation()}>
              <div className="wf-step-head">
                <span className="wf-step-name">{stepStatus?.alias || stepStatus?.name || stepStatus?.id}</span>
                {stepStatus && <StatusBadge tone={stepBadge(stepStatus).tone} label={stepBadge(stepStatus).label} />}
                <Button
                  className="wf-step-close"
                  text
                  title={i18n.t('Close').toString()}
                  onClick={() => this.setState({ showDetail: false })}
                >
                  <AiOutlineClose />
                </Button>
              </div>
              {stepStatus?.phase === 'suspending' && (
                <div className="wf-step-actions">{this.renderStepActions(stepStatus)}</div>
              )}
              <Tab shape="pure" size="small" activeKey={String(this.state.activeKey)} onChange={this.onTabChange}>
                <Tab.Item title={<Translation>Detail</Translation>} key={'detail'}>
                  {stepStatus && (
                    <dl className="wf-kv">
                      <dt>
                        <Translation>Step</Translation>
                      </dt>
                      <dd>{stepStatus.name || stepStatus.id}</dd>
                      <dt>
                        <Translation>Type</Translation>
                      </dt>
                      <dd>{stepStatus.type}</dd>
                      {!!stepSpec?.if && (
                        <>
                          <dt>
                            <Translation>Condition</Translation>
                          </dt>
                          <dd>
                            <code>{stepSpec?.if}</code>
                          </dd>
                        </>
                      )}
                      <dt>
                        <Translation>First run</Translation>
                      </dt>
                      <dd>{momentDate(stepStatus.firstExecuteTime) || '-'}</dd>
                      <dt>
                        <Translation>Last run</Translation>
                      </dt>
                      <dd>{momentDate(stepStatus.lastExecuteTime) || '-'}</dd>
                      <dt>
                        <Translation>Duration</Translation>
                      </dt>
                      <dd>{timeDiff(stepStatus.firstExecuteTime, stepStatus.lastExecuteTime) || '-'}</dd>
                      {!!stepSpec?.timeout && (
                        <>
                          <dt>
                            <Translation>Timeout</Translation>
                          </dt>
                          <dd>{stepSpec?.timeout}</dd>
                        </>
                      )}
                      {!!(stepStatus.message || stepStatus.reason) && (
                        <>
                          <dt>
                            <Translation>Message</Translation>
                          </dt>
                          <dd>
                            {stepStatus.message || ''}
                            {stepStatus.reason && <span className="wf-kv-reason">{stepStatus.reason}</span>}
                          </dd>
                        </>
                      )}
                    </dl>
                  )}
                  {logSource && (
                    <div className="wf-step-log">
                      <div className="wf-step-log-head">
                        <Translation>Step Logs</Translation>
                        <Button text loading={logLoading} onClick={() => this.onGetStepLog()}>
                          <HiOutlineRefresh />
                        </Button>
                      </div>
                      <div className="wf-step-log-body">
                        {logs?.map((line, i: number) => (
                          <div key={`log-${i}`}>
                            <Ansi linkify={true}>{line}</Ansi>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Tab.Item>
                <Tab.Item title={i18n.t('Properties').toString()} key={'properties'}>
                  {generated ? (
                    <>
                      <Message type="notice" className="wf-step-generated">
                        <Translation>
                          KubeVela generated this step. The workflow declares none, so each component is applied by a
                          step named after it.
                        </Translation>
                      </Message>
                      <dl className="wf-kv">
                        <dt>component</dt>
                        <dd>
                          <Link to={`/applications/${applicationDetail.name}/config/components`}>
                            {generated.component}
                          </Link>
                        </dd>
                      </dl>
                    </>
                  ) : properties && Object.keys(properties).length > 0 ? (
                    <dl className="wf-kv">
                      {Object.keys(properties).map((key: string) => (
                        <React.Fragment key={key}>
                          <dt>{key}</dt>
                          <dd>
                            <code>{properties && convertAny(properties[key])}</code>
                          </dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  ) : (
                    <Empty hideIcon message={'There are no properties.'} />
                  )}
                </Tab.Item>
                <Tab.Item title={i18n.t('Outputs').toString()} key={'outputs'}>
                  <Loading visible={!!outputLoading} style={{ width: '100%' }}>
                    {outputs?.values && outputs.values.length > 0 ? (
                      <Table dataSource={outputs.values} size="small" hasBorder={false} locale={locale().Table}>
                        <Table.Column title={i18n.t('Name').toString()} dataIndex="name" />
                        <Table.Column
                          title={i18n.t('Value').toString()}
                          dataIndex="value"
                          cell={(v: string) => <code>{v}</code>}
                        />
                        <Table.Column
                          title={i18n.t('Value From').toString()}
                          dataIndex="valueFrom"
                          cell={(v: string) => v || '-'}
                        />
                      </Table>
                    ) : (
                      !outputLoading && <Empty hideIcon message={'There are no outputs.'} />
                    )}
                  </Loading>
                </Tab.Item>
                <Tab.Item title={i18n.t('Inputs').toString()} key={'inputs'}>
                  <Loading visible={!!inputLoading} style={{ width: '100%' }}>
                    {inputs?.values && inputs.values.length > 0 ? (
                      <Table dataSource={inputs.values} size="small" hasBorder={false} locale={locale().Table}>
                        <Table.Column title={i18n.t('From Step').toString()} dataIndex="fromStep" />
                        <Table.Column title={i18n.t('From').toString()} dataIndex="from" />
                        <Table.Column
                          title={i18n.t('Value').toString()}
                          dataIndex="value"
                          cell={(v: string) => <code>{v}</code>}
                        />
                        <Table.Column
                          title={i18n.t('Parameter Key').toString()}
                          dataIndex="parameterKey"
                          cell={(v: string) => v || '-'}
                        />
                      </Table>
                    ) : (
                      !inputLoading && <Empty hideIcon message={'There are no inputs.'} />
                    )}
                  </Loading>
                </Tab.Item>
              </Tab>
            </div>
          </If>
        </div>
      </div>
    );
  }
}

export default ApplicationWorkflowRecord;
