import { Grid, Button, Dialog, Message, Balloon } from '@alifd/next';
import classNames from 'classnames';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Component } from 'react';
import { HiOutlineRefresh } from 'react-icons/hi';
import type { Dispatch } from 'redux';
import { TiWarningOutline } from 'react-icons/ti';
import { resumePipelineRun, runPipeline, stopPipelineRun, terminatePipelineRun } from '../../../../api/pipeline';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { PipelineDetail, PipelineRunBase, PipelineRunStatus } from '@velaux/data';
import { momentDate, timeDiff } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import RunStatusIcon from '../RunStatusIcon';
import { Breadcrumb } from '../../../../components/Breadcrumb';

const { Row, Col } = Grid;

interface Props {
  pipeline?: PipelineDetail;
  runStatus?: PipelineRunStatus;
  runBase?: PipelineRunBase;
  loadRunStatus: () => void;
  statusLoading: boolean;
  dispatch?: Dispatch<any>;
}

interface State {
  stopLoading?: boolean;
  reRunLoading?: boolean;
  resumeLoading?: boolean;
  terminateLoading?: boolean;
}

@connect((store: any) => {
  return { ...store.user };
})
class Header extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  onRerun = () => {
    Dialog.confirm({
      type: 'alert',
      content: i18n.t('Are you sure to rerun this Pipeline?').toString(),
      locale: locale().Dialog,
      onOk: () => {
        const { pipeline, runBase } = this.props;
        if (runBase && pipeline) {
          this.setState({ reRunLoading: true });
          runPipeline(runBase?.project.name, pipeline?.name, runBase.contextName)
            .then((res) => {
              if (res && res.pipelineRunName && this.props.dispatch) {
                this.props.dispatch(
                  routerRedux.push(
                    `/projects/${pipeline.project.name}/pipelines/${pipeline.name}/runs/${res.pipelineRunName}`
                  )
                );
              }
            })
            .finally(() => {
              this.setState({ reRunLoading: false });
            });
        }
      },
    });
  };

  onStop = () => {
    Dialog.confirm({
      type: 'alert',
      content: 'Are you sure to stop this Pipeline?',
      locale: locale().Dialog,
      onOk: () => {
        const { pipeline, runBase } = this.props;
        if (runBase && pipeline) {
          this.setState({ stopLoading: true });
          stopPipelineRun({
            pipelineName: pipeline?.name,
            projectName: runBase?.project.name,
            runName: runBase?.pipelineRunName,
          })
            .then((res) => {
              if (res) {
                Message.success('Pipeline stopped successfully.');
              }
            })
            .finally(() => {
              this.setState({ stopLoading: false });
            });
        }
      },
    });
  };

  onTerminatePipelineRun = () => {
    const { pipeline, runBase, loadRunStatus } = this.props;
    if (!pipeline || !runBase) {
      return;
    }
    const params = {
      projectName: pipeline.project.name,
      pipelineName: runBase.pipelineName,
      runName: runBase?.pipelineRunName,
    };
    this.setState({ terminateLoading: true });
    terminatePipelineRun(params)
      .then((re) => {
        if (re) {
          Message.success(i18n.t('Pipeline terminated successfully'));
          loadRunStatus();
        }
      })
      .finally(() => {
        this.setState({ terminateLoading: false });
      });
  };

  onResumePipelineRun = () => {
    const { pipeline, runBase, loadRunStatus } = this.props;
    if (!pipeline || !runBase) {
      return;
    }
    const params = {
      projectName: pipeline.project.name,
      pipelineName: runBase.pipelineName,
      runName: runBase?.pipelineRunName,
    };
    this.setState({ resumeLoading: true });
    resumePipelineRun(params)
      .then((re) => {
        if (re) {
          Message.success(i18n.t('Pipeline resumed successfully'));
          loadRunStatus();
        }
      })
      .finally(() => {
        this.setState({ resumeLoading: false });
      });
  };

  render() {
    const { pipeline, runBase, runStatus, statusLoading } = this.props;
    const projectName = (pipeline && pipeline.project?.name) || '';
    const runCondition = runStatus?.conditions?.filter((con) => con.type === 'WorkflowRun');
    const { reRunLoading, stopLoading, resumeLoading, terminateLoading } = this.state;
    const message = runStatus?.message;

    return (
      <div>
        <Row style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <Breadcrumb
              items={[
                {
                  to: '/projects/' + projectName + '/pipelines',
                  title: projectName,
                },
                {
                  to: `/projects/${projectName}/pipelines/${pipeline?.name}/studio`,
                  title: (pipeline && (pipeline.alias || pipeline.name)) || '',
                },
                { title: runBase?.pipelineRunName || '' },
              ]}
            />
          </Col>
          <Col span={18} className="flexright" style={{ padding: '0 16px' }}>
            <Permission
              request={{
                resource: `project:${projectName}/pipeline:${pipeline && pipeline.name}`,
                action: 'run',
              }}
              project={projectName}
            >
              <Button
                loading={reRunLoading}
                disabled={
                  runStatus?.status != 'failed' && runStatus?.status != 'succeeded' && runStatus?.status != 'terminated'
                }
                style={{ marginLeft: '16px' }}
                type="primary"
                onClick={() => this.onRerun()}
              >
                <Translation>Rerun</Translation>
              </Button>
            </Permission>
            <If condition={runStatus?.status == 'executing' || runStatus?.status == 'suspending'}>
              <Permission
                request={{
                  resource: `project:${projectName}/pipeline:${pipeline && pipeline.name}/pipelineRun:${
                    runBase?.pipelineRunName
                  }`,
                  action: 'run',
                }}
                project={projectName}
              >
                <Button
                  loading={stopLoading}
                  style={{ marginLeft: '16px' }}
                  type="primary"
                  onClick={() => this.onStop()}
                >
                  <Translation>Stop</Translation>
                </Button>
              </Permission>
            </If>
          </Col>
        </Row>
        <Row className="description" wrap={true}>
          <Col xl={16} xs={24}>
            <div className="name_metadata">
              <div>
                <div className="name">{runBase?.pipelineRunName}</div>
                <div className="metadata">
                  <div className="start_at">
                    <span className="label_key">Started at:</span>
                    <time className="label_value">{momentDate(runStatus?.startTime)}</time>
                  </div>
                  <div className="duration_time">
                    <span className="label_key">Duration:</span>
                    <time className="label_value">{timeDiff(runStatus?.startTime, runStatus?.endTime)}</time>
                  </div>
                  <div className="mode">
                    <span className="label_key">Mode:</span>
                    <time className="label_value">{runStatus?.mode?.steps || 'StepByStep'}</time>
                  </div>
                  <div className="mode">
                    <span className="label_key">Sub Step Mode:</span>
                    <time className="label_value">{runStatus?.mode?.subSteps || 'DAG'}</time>
                  </div>
                  <Balloon
                    trigger={
                      <div>
                        <span className="label_key">Context:</span>
                        <time className="label_value">{runBase?.contextName || '-'}</time>
                      </div>
                    }
                  >
                    {runBase?.contextValues?.map((item) => {
                      return (
                        <div key={item.key}>
                          <span className="label_key">{item.key}=</span>
                          <span className="label_value">{item.value}</span>
                        </div>
                      );
                    })}
                  </Balloon>
                </div>
              </div>
              <div className="flexright">
                <Button type="secondary" loading={statusLoading} onClick={this.props.loadRunStatus}>
                  <HiOutlineRefresh />
                </Button>
              </div>
            </div>
          </Col>
          <Col xl={8} xs={24}>
            <If condition={!runCondition || runCondition.length == 0 || runCondition[0].status == 'True'}>
              <div
                className={classNames(
                  'status',
                  { warning: runStatus?.status == 'failed' || runStatus?.status === 'terminated' },
                  { success: runStatus?.status == 'succeeded' }
                )}
              >
                <RunStatusIcon status={runStatus?.status} />
                <If condition={message}>
                  <div className="message">
                    <div className="summary">{runStatus?.status == 'failed' ? 'Error Summary' : 'Summary'}</div>
                    <p className="text">{message}</p>
                  </div>
                </If>
                <If condition={runStatus?.status === 'suspending'}>
                  <div className={classNames('suspend-actions')}>
                    <div className="desc">This Pipeline need you approve.</div>
                    <Button.Group>
                      <Button
                        type="secondary"
                        size="small"
                        loading={terminateLoading}
                        className="margin-top-5 margin-left-8"
                        title="Terminate this workflow"
                        onClick={this.onTerminatePipelineRun}
                      >
                        <Translation>Terminate</Translation>
                      </Button>

                      <Button
                        type="primary"
                        size="small"
                        loading={resumeLoading}
                        className="margin-top-5 margin-left-8"
                        title="Approve and continue this workflow"
                        onClick={this.onResumePipelineRun}
                      >
                        <Translation>Resume</Translation>
                      </Button>
                    </Button.Group>
                  </div>
                </If>
              </div>
            </If>
            <If condition={runCondition && runCondition[0].status == 'False'}>
              <div className={classNames('status', { warning: runStatus?.status == 'failed' })}>
                <div className="icon">
                  <TiWarningOutline />
                  <span>{(runStatus?.status || 'pending').toUpperCase()}</span>
                </div>
                <If condition={runCondition && runCondition[0].message}>
                  <div className="message">
                    <div className="summary">Error Summary</div>
                    <p className="text">{runCondition && runCondition[0].message}</p>
                  </div>
                </If>
              </div>
            </If>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Header;
