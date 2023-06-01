import React from 'react';

import type {
  ApplicationDetail,
  Workflow,
  WorkflowRecord,
  WorkflowRecordBase,
  WorkflowStepStatus,
 WorkflowStepBase, WorkflowStepInputs, WorkflowStepOutputs } from '@velaux/data';

import { Card, Button, Tab, Loading, Grid, Message } from '@alifd/next';
import Ansi from 'ansi-to-react';
import classNames from 'classnames';
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
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import { convertAny, momentDate, timeDiff } from '../../../../utils/common';
import RunStatusIcon from '../../../PipelineRunPage/components/RunStatusIcon';
import { HiOutlineRefresh } from 'react-icons/hi';

const { Row, Col } = Grid;

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

  resumeLoading?: boolean;
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
      this.setState({ inputLoading: true });
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

  onResumeApplicationWorkflowRecord = () => {
    const { applicationDetail, workflow, recordName } = this.props;
    const params = {
      appName: applicationDetail.name,
      workflowName: workflow.name,
      recordName,
    };
    this.setState({ resumeLoading: true });
    resumeApplicationWorkflowRecord(params)
      .then((re) => {
        if (re) {
          Message.success('Workflow resumed successfully');
          this.loadWorkflowRecord();
        }
      })
      .finally(() => {
        this.setState({ resumeLoading: false });
      });
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
      rollbackLoading,
      resumeLoading,
      terminateLoading,
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
      const newProperties: Record<string, any> = JSON.parse(properties);
      properties = newProperties;
    }

    return (
      <div>
        <Row className="description" wrap={true}>
          <Col xl={16} xs={24}>
            <div className="name_metadata">
              <div>
                <div className="name">{showRecord?.name}</div>
                <div className="metadata">
                  <div className="start_at">
                    <span className="label_key">Started at:</span>
                    <time className="label_value">{momentDate(showRecord?.startTime)}</time>
                  </div>
                  <div className="duration_time">
                    <span className="label_key">Duration:</span>
                    <time className="label_value">{timeDiff(showRecord?.startTime, showRecord?.endTime)}</time>
                  </div>
                  <div className="mode">
                    <span className="label_key">Mode:</span>
                    <time className="label_value">{showRecord?.mode || 'StepByStep-DAG'}</time>
                  </div>
                  <div className="mode">
                    <span className="label_key">Revision:</span>
                    <time className="label_value">
                      <Link to={`/applications/${applicationDetail.name}/revisions`}>
                        {showRecord?.applicationRevision}
                      </Link>
                    </time>
                  </div>
                </div>
              </div>
              <div className="flexright">
                <Button
                  type="secondary"
                  loading={statusLoading}
                  onClick={() => {
                    this.loadWorkflowRecord();
                  }}
                >
                  <HiOutlineRefresh />
                </Button>
              </div>
            </div>
          </Col>
          <Col xl={8} xs={24}>
            <div
              className={classNames(
                'status',
                { warning: showRecord?.status == 'failed' || showRecord?.status === 'terminated' },
                { success: showRecord?.status == 'succeeded' }
              )}
            >
              <RunStatusIcon status={showRecord?.status} />
              <If condition={showRecord?.message}>
                <div className="message">
                  <div className="summary">{showRecord?.status == 'failed' ? 'Error Summary' : 'Summary'}</div>
                  <p className="text">{showRecord?.message}</p>
                </div>
              </If>
              <If condition={showRecord?.status === 'suspending'}>
                <div className={classNames('suspend-actions')}>
                  <div className="desc">
                    <Translation>This workflow needs your approving</Translation>
                  </div>
                  <Button.Group>
                    <Button
                      type="secondary"
                      size="small"
                      loading={rollbackLoading}
                      className="margin-top-5 margin-left-8"
                      onClick={this.onRollbackApplicationWorkflowRecord}
                      title="Rollback to last ready revision"
                    >
                      <Translation>Rollback</Translation>
                    </Button>

                    <Button
                      type="secondary"
                      size="small"
                      loading={terminateLoading}
                      className="margin-top-5 margin-left-8"
                      title="Terminate this workflow"
                      onClick={this.onTerminateApplicationWorkflowRecord}
                    >
                      <Translation>Terminate</Translation>
                    </Button>

                    <Button
                      type="primary"
                      size="small"
                      loading={resumeLoading}
                      className="margin-top-5 margin-left-8"
                      title="Approve and continue this workflow"
                      onClick={this.onResumeApplicationWorkflowRecord}
                    >
                      <Translation>Continue</Translation>
                    </Button>
                  </Button.Group>
                </div>
              </If>
            </div>
          </Col>
        </Row>
        <div
          className="run-studio"
          style={{
            paddingLeft: '2rem',
            height: 'calc(100vh - 400px)',
          }}
          onClick={() => {
            this.setState({ showDetail: false });
          }}
        >
          <div className={classNames('studio')}>
            {showRecord && (
              <PipelineGraph
                name={`${showRecord?.name}`}
                zoom={zoom}
                onNodeClick={this.onStepClick}
                steps={showRecord?.steps}
              />
            )}
          </div>
          <If condition={showDetail && stepStatus}>
            <Card
              title={stepStatus?.alias || stepStatus?.name || stepStatus?.id}
              className={classNames('detail')}
              contentHeight="auto"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <Tab animation={true} size="medium" onChange={this.onTabChange}>
                <Tab.Item title={<Translation>Detail</Translation>} key={'detail'}>
                  <div className="detail-page">
                    <div className="step-info padding16">
                      {stepStatus && (
                        <tbody>
                          <tr>
                            <th>Step:</th>
                            <td>{stepStatus.name || stepStatus?.id}</td>
                          </tr>
                          <tr>
                            <th>Type:</th>
                            <td>{stepStatus.type}</td>
                          </tr>
                          <If condition={stepSpec?.if}>
                            <tr>
                              <th>Condition:</th>
                              <td>{stepSpec?.if}</td>
                            </tr>
                          </If>
                          <tr>
                            <th>First Execute Time:</th>
                            <td>{stepStatus.firstExecuteTime}</td>
                          </tr>
                          <tr>
                            <th>Last Execute Time:</th>
                            <td>{stepStatus.lastExecuteTime}</td>
                          </tr>
                          <tr>
                            <th>Duration:</th>
                            <td>{timeDiff(stepStatus.firstExecuteTime, stepStatus.lastExecuteTime)}</td>
                          </tr>
                          <If condition={stepSpec?.timeout}>
                            <tr>
                              <th>Timeout:</th>
                              <td>{stepSpec?.timeout}</td>
                            </tr>
                          </If>
                          <tr>
                            <th>Phase:</th>
                            <td className={'step-status-text-' + stepStatus.phase}>{stepStatus.phase}</td>
                          </tr>
                          <If condition={stepStatus.message || stepStatus.reason}>
                            <tr>
                              <th>Message(Reason):</th>
                              <td>
                                {`${stepStatus.message || ''}`}
                                {stepStatus.reason && `(${stepStatus.reason})`}
                              </td>
                            </tr>
                          </If>
                        </tbody>
                      )}
                    </div>
                    {logSource && (
                      <div className="step-log">
                        <div className="header">
                          <div>Step Logs</div>
                          <Button
                            loading={logLoading}
                            onClick={() => {
                              this.onGetStepLog();
                            }}
                            style={{ color: '#fff' }}
                            size="small"
                          >
                            <HiOutlineRefresh />
                          </Button>
                        </div>
                        <div className="log-content">
                          {logs?.map((line, i: number) => {
                            return (
                              <div key={`log-${i}`} className="logLine">
                                <span className="content">
                                  <Ansi linkify={true}>{line}</Ansi>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Tab.Item>
                <Tab.Item title={i18n.t('Properties').toString()} key={'properties'}>
                  <div className="step-info padding16">
                    <tbody>
                      {properties &&
                        Object.keys(properties).map((key: string) => {
                          return (
                            <tr>
                              <th>{key}:</th>
                              <td>{properties && convertAny(properties[key])}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </div>
                </Tab.Item>
                <Tab.Item title={i18n.t('Outputs')} key={'outputs'}>
                  <If condition={!outputLoading && (!outputs || !outputs.values || outputs.values.length == 0)}>
                    <Empty hideIcon message={'There are no outputs.'} />
                  </If>
                  <Loading visible={outputLoading} style={{ width: '100%' }}>
                    <div className="step-info padding16">
                      {outputs?.values?.map((value) => {
                        return (
                          <tbody>
                            <tr>
                              <th>Name: </th>
                              <td>{value.name}</td>
                            </tr>
                            <tr>
                              <th>Value: </th>
                              <td>{value.value}</td>
                            </tr>
                            <tr>
                              <th>Value From</th>
                              <td>{value.valueFrom || '-'}</td>
                            </tr>
                          </tbody>
                        );
                      })}
                    </div>
                  </Loading>
                </Tab.Item>
                <Tab.Item title={i18n.t('Inputs')} key={'inputs'}>
                  <If condition={!inputLoading && (!inputs || !inputs?.values || inputs.values.length == 0)}>
                    <Empty hideIcon message={'There are no inputs.'} />
                  </If>
                  <Loading visible={inputLoading} style={{ width: '100%' }}>
                    <div className="step-info padding16">
                      <tbody>
                        {inputs?.values?.map((value) => {
                          return (
                            <tbody>
                              <tr>
                                <th>From Step: </th>
                                <td>{value.fromStep}</td>
                              </tr>
                              <tr>
                                <th>From: </th>
                                <td>{value.from}</td>
                              </tr>
                              <tr>
                                <th>Value: </th>
                                <td>{value.value}</td>
                              </tr>
                              <tr>
                                <th>ParameterKey</th>
                                <td>{value.parameterKey || '-'}</td>
                              </tr>
                            </tbody>
                          );
                        })}
                      </tbody>
                    </div>
                  </Loading>
                </Tab.Item>
              </Tab>
            </Card>
          </If>
        </div>
      </div>
    );
  }
}

export default ApplicationWorkflowRecord;
