import { Grid, Button, Dialog, Message, Balloon } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Component } from 'react';
import { HiOutlineRefresh } from 'react-icons/hi';
import type { Dispatch } from 'redux';
import { resumePipelineRun, runPipeline, stopPipelineRun, terminatePipelineRun } from '../../../../api/pipeline';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { PipelineDetail, PipelineRunBase, PipelineRunStatus } from '@velaux/data';
import { momentDate, timeDiff } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { recordStatus } from '../../../../components/PipelineGraph/status';
import { StatusBadge } from '../../../../components/StatusBadge';
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
    const conditionFailed = !!runCondition && runCondition.length > 0 && runCondition[0].status == 'False';
    const status = recordStatus(runStatus?.status || (conditionFailed ? 'pending' : undefined));
    // alert is the WorkflowRun condition's message when that condition is false, else the run's own message.
    const alert = conditionFailed ? runCondition && runCondition[0].message : runStatus?.message;
    const failed = conditionFailed || runStatus?.status === 'failed' || runStatus?.status === 'terminated';

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
        <div className="description">
          <div className="name_metadata">
            <div>
              <div className="name">
                <span>{runBase?.pipelineRunName}</span>
                {runStatus && <StatusBadge tone={status.tone} label={status.label} />}
              </div>
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
          <If condition={alert}>
            <Message type={failed ? 'error' : 'notice'} className="run-alert">
              {alert}
            </Message>
          </If>
          <If condition={!conditionFailed && runStatus?.status === 'suspending'}>
            <Message type="notice" className="run-alert">
              <div className="run-approval">
                <Translation>This pipeline needs your approval.</Translation>
                <Button
                  size="small"
                  loading={terminateLoading}
                  title={i18n.t('Terminate this workflow').toString()}
                  onClick={this.onTerminatePipelineRun}
                >
                  <Translation>Terminate</Translation>
                </Button>
                <Button
                  type="primary"
                  size="small"
                  loading={resumeLoading}
                  title={i18n.t('Approve and continue this workflow').toString()}
                  onClick={this.onResumePipelineRun}
                >
                  <Translation>Resume</Translation>
                </Button>
              </div>
            </Message>
          </If>
        </div>
      </div>
    );
  }
}

export default Header;
