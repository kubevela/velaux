import { Button, Card, Loading, Tab } from '@alifd/next';
import Ansi from 'ansi-to-react';
import classNames from 'classnames';
import { Link } from 'dva/router';
import React, { Component } from 'react';
import { HiOutlineRefresh } from 'react-icons/hi';

import {
  loadPipeline,
  loadPipelineRunBase,
  loadPipelineRunStatus,
  loadPipelineRunStepInputs,
  loadPipelineRunStepLogs,
  loadPipelineRunStepOutputs,
} from '../../api/pipeline';
import Empty from '../../components/Empty';
import { If } from '../../components/If';
import PipelineGraph from '../../components/PipelineGraph';
import { Translation } from '../../components/Translation';
import type { WorkflowStepStatus ,
  PipelineDetail,
  PipelineRunBase,
  PipelineRunStatus,
  WorkflowStep,
  WorkflowStepInputs,
  WorkflowStepOutputs,
} from '@velaux/data';
import { convertAny, timeDiff } from '../../utils/common';

import Header from './components/Header';
import './index.less';

interface Props {
  match: {
    params: {
      pipelineName: string;
      projectName: string;
      runName: string;
    };
  };
  location?: {
    pathname: string;
  };
}

interface State {
  loading: boolean;
  runBase?: PipelineRunBase;
  runStatus?: PipelineRunStatus;
  showDetail: boolean;
  stepName?: string;
  logs?: string[];
  logLoading?: boolean;
  stepStatus?: WorkflowStepStatus;
  activeKey: string | number;
  pipelineDetail?: PipelineDetail;
  outputLoading?: boolean;
  inputLoading?: boolean;
  outputs?: WorkflowStepOutputs;
  inputs?: WorkflowStepInputs;
}

class PipelineRunPage extends Component<Props, State> {
  loop: boolean;
  disableLoop: boolean;
  constructor(props: any) {
    super(props);
    this.state = {
      loading: false,
      showDetail: false,
      activeKey: 'detail',
    };
    this.loop = false;
    this.disableLoop = false;
  }
  componentWillUnmount() {
    this.disableLoop = true;
  }
  componentDidMount() {
    this.onGetPipeline(this.props.match);
    this.onGetRunBase(this.props.match);
    this.onGetRunStatus(this.props.match);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.location?.pathname != this.props.location?.pathname && nextProps.match) {
      this.onGetPipeline(nextProps.match);
      this.onGetRunBase(nextProps.match);
      this.onGetRunStatus(nextProps.match);
    }
  }

  onGetPipeline = (match?: {
    params: {
      pipelineName: string;
      projectName: string;
      runName: string;
    };
  }) => {
    const { projectName, pipelineName } = match ? match.params : this.props.match.params;
    loadPipeline({ projectName: projectName, pipelineName: pipelineName }).then((res: PipelineDetail) => {
      this.setState({ pipelineDetail: res });
    });
  };

  onGetRunBase = (match?: {
    params: {
      pipelineName: string;
      projectName: string;
      runName: string;
    };
  }) => {
    const { projectName, pipelineName, runName } = match ? match.params : this.props.match.params;
    loadPipelineRunBase({ projectName, pipelineName, runName }).then((res) => {
      this.setState({ runBase: res });
    });
  };

  onGetStepLogs = () => {
    const { projectName, pipelineName, runName } = this.props.match.params;
    const { stepStatus } = this.state;
    if (stepStatus?.name) {
      this.setState({ logLoading: true });
      loadPipelineRunStepLogs({
        projectName,
        pipelineName,
        runName,
        stepName: stepStatus?.name,
      })
        .then((res: { log: string }) => {
          const logLines = res && res.log ? res.log.split('\n') : [];
          this.setState({ logs: logLines });
        })
        .finally(() => {
          this.setState({ logLoading: false });
        });
    }
  };

  onGetRunStatus = (match?: {
    params: {
      pipelineName: string;
      projectName: string;
      runName: string;
    };
  }) => {
    const { projectName, pipelineName, runName } = match && match.params ? match.params : this.props.match.params;
    this.setState({ loading: true });
    loadPipelineRunStatus({ projectName, pipelineName, runName })
      .then((res: PipelineRunStatus) => {
        if (res) {
          this.setState({ runStatus: res });
          if (
            res.status &&
            ['terminated', 'failed', 'succeeded'].indexOf(res.status) == -1 &&
            !this.loop &&
            !this.disableLoop
          ) {
            this.loop = true;
            setTimeout(() => {
              this.loop = false;
              this.onGetRunStatus();
            }, 5000);
          }
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  onGetStepOutput = () => {
    const { projectName, pipelineName, runName } = this.props.match.params;
    const { stepStatus } = this.state;
    if (stepStatus) {
      this.setState({ outputLoading: true });
      loadPipelineRunStepOutputs({
        projectName,
        pipelineName,
        runName,
        stepName: stepStatus?.name,
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

  onGetStepInput = () => {
    const { projectName, pipelineName, runName } = this.props.match.params;
    const { stepStatus } = this.state;
    if (stepStatus) {
      this.setState({ inputLoading: true });
      loadPipelineRunStepInputs({
        projectName,
        pipelineName,
        runName,
        stepName: stepStatus?.name,
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
      this.onGetStepLogs();
    }
    if (key == 'inputs' && stepStatus) {
      this.onGetStepInput();
    }
  };

  render() {
    const {
      loading,
      runStatus,
      showDetail,
      logs,
      runBase,
      stepStatus,
      logLoading,
      pipelineDetail,
      inputLoading,
      outputLoading,
      inputs,
      outputs,
    } = this.state;
    let addonName: string | undefined = '';
    let stepSpec: WorkflowStep | undefined;
    runBase?.spec.workflowSpec.steps.map((step) => {
      if (stepStatus && step.name == stepStatus.name) {
        addonName = step.properties?.addonName;
        stepSpec = step;
      }
      step.subSteps?.map((sub) => {
        if (stepStatus && sub.name == stepStatus.name) {
          addonName = sub.properties?.addonName;
          stepSpec = sub;
        }
      });
    });
    return (
      <div className="run-layout">
        <Header
          statusLoading={loading}
          runBase={runBase}
          runStatus={runStatus}
          loadRunStatus={this.onGetRunStatus}
          pipeline={pipelineDetail}
        />
        <div
          className="run-studio"
          onClick={() => {
            this.setState({ showDetail: false });
          }}
        >
          <div className={classNames('studio')}>
            {runStatus && (
              <PipelineGraph
                name={`${runBase?.pipelineRunName}`}
                steps={runStatus.steps}
                zoom={1}
                onNodeClick={this.onStepClick}
              />
            )}
          </div>
          <If condition={showDetail && stepStatus}>
            <Card
              title={'Step: ' + stepStatus?.name || stepStatus?.id}
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
                            <th>Type:</th>
                            <td>{stepStatus.type}</td>
                          </tr>
                          <If condition={addonName}>
                            <tr>
                              <th>Addon:</th>
                              <td>
                                <Link to={`/addons/${addonName}`}>{addonName}</Link> (Click here to check the addon
                                detail)
                              </td>
                            </tr>
                          </If>
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
                    <div className="step-log">
                      <div className="header">
                        <div>Step Logs</div>
                        <Button
                          loading={logLoading}
                          onClick={() => {
                            this.onGetStepLogs();
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
                  </div>
                </Tab.Item>
                <Tab.Item title="Properties" key={'properties'}>
                  <div className="step-info padding16">
                    <tbody>
                      {stepSpec &&
                        stepSpec.properties &&
                        Object.keys(stepSpec.properties).map((key: string) => {
                          return (
                            <tr key={key}>
                              <th>{key}:</th>
                              <td>{stepSpec && stepSpec.properties && convertAny(stepSpec.properties[key])}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </div>
                </Tab.Item>
                <Tab.Item title="Outputs" key={'outputs'}>
                  <If condition={!outputLoading && (!outputs || !outputs.values || outputs.values.length == 0)}>
                    <Empty hideIcon message={'There are no outputs.'} />
                  </If>
                  <Loading visible={outputLoading} style={{ width: '100%' }}>
                    <div className="step-info padding16">
                      {outputs?.values?.map((value) => {
                        return (
                          <tbody key={value.name}>
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
                <Tab.Item title="Inputs" key={'inputs'}>
                  <If condition={!inputLoading && (!inputs || !inputs?.values || inputs.values.length == 0)}>
                    <Empty hideIcon message={'There are no inputs.'} />
                  </If>
                  <Loading visible={inputLoading} style={{ width: '100%' }}>
                    <div className="step-info padding16">
                      <tbody>
                        {inputs?.values?.map((value) => {
                          return (
                            <tbody key={value.fromStep + value.from}>
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

export default PipelineRunPage;
