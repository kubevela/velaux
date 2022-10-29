import React, { Component } from 'react';
import { connect } from 'dva';
import type { Dispatch } from 'redux';
import Title from '../../components/ListTitle';
import { Loading, Button, Table, Dialog, Message, Balloon } from '@b-design/ui';
import SelectSearch from './components/SelectSearch';
import type { LoginUserInfo } from '../../interface/user';
import Permission from '../../components/Permission';
import Translation from '../../components/Translation';
import type { Pipeline, PipelineRun, RunStateInfo } from '../../interface/pipeline';
import locale from '../../utils/locale';
import { Link, routerRedux } from 'dva/router';
import type { NameAlias } from '../../interface/env';
import { deletePipeline, listPipelines } from '../../api/pipeline';
import { AiFillCaretRight, AiFillDelete } from 'react-icons/ai';
import { BiCopyAlt } from 'react-icons/bi';
import { HiViewList } from 'react-icons/hi';
import './index.less';
import { If } from 'tsx-control-statements/components';
import RunPipeline from '../../components/RunPipeline';
import ViewRuns from './components/ViewRuns';
import i18n from '../../i18n';
import CreatePipeline from './components/CreatePipeline';
import { beautifyTime, momentDate } from '../../utils/common';
import ClonePipeline from './components/PipelineClone';
import RunStatusIcon from '../PipelineRunPage/components/RunStatusIcon';
import type { AddonBaseStatus } from '../../interface/addon';

type Props = {
  targets?: [];
  envs?: [];
  history: any;
  userInfo?: LoginUserInfo;
  dispatch: Dispatch<any>;
  enabledAddons?: AddonBaseStatus[];
};

export type ShowMode = 'table' | 'card' | string | null;

type State = {
  isLoading: boolean;
  editItem?: Pipeline;
  pipelines?: Pipeline[];
  showMode: ShowMode;
  showRunPipeline?: boolean;
  pipeline?: Pipeline;
  showRuns?: boolean;
  showNewPipeline?: boolean;
  showClonePipeline?: boolean;
};

@connect((store: any) => {
  return { ...store.user, ...store.addons };
})
class PipelineListPage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      showMode: 'list',
    };
  }

  componentDidMount() {
    this.getPipelines({});
  }

  getPipelines = async (params: { projectName?: string; query?: string }) => {
    this.setState({ isLoading: true });
    listPipelines(params)
      .then((res) => {
        this.setState({
          pipelines: res && Array.isArray(res.pipelines) ? res.pipelines : [],
        });
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  };

  onShowPipelineRuns = (pipeline: Pipeline) => {
    this.setState({ showRuns: true, pipeline: pipeline });
  };

  onRunPipeline = (pipeline: Pipeline) => {
    this.setState({ pipeline: pipeline, showRunPipeline: true });
  };

  onClonePipeline = (pipeline: Pipeline) => {
    this.setState({ pipeline, showClonePipeline: true });
  };

  onDeletePipeline = (pipeline: Pipeline) => {
    Dialog.confirm({
      type: 'confirm',
      content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
      onOk: () => {
        deletePipeline({
          projectName: pipeline.project.name,
          pipelineName: pipeline.name,
        }).then((res) => {
          if (res) {
            Message.success(i18n.t('The Pipeline removed successfully'));
            this.getPipelines({});
          }
        });
      },
      locale: locale().Dialog,
    });
  };

  renderPipelineTable = () => {
    const { pipelines } = this.state;
    return (
      <div className="table-pipeline-list">
        <Table
          className="customTable"
          size="medium"
          style={{ minWidth: '1400px' }}
          locale={locale().Table}
          dataSource={pipelines}
        >
          <Table.Column
            key={'name'}
            title="Name(Alias)"
            dataIndex="name"
            cell={(name: string, i: number, pipeline: Pipeline) => {
              let text = name;
              if (pipeline.alias) {
                text = `${name}(${pipeline.alias})`;
              }
              return (
                <div className="pipeline-name">
                  <a
                    onClick={() => {
                      this.setState({ pipeline: pipeline, showNewPipeline: true });
                    }}
                  >
                    {text}
                  </a>
                  <span>{pipeline.description}</span>
                </div>
              );
            }}
          />
          <Table.Column
            key={'project'}
            title="Project"
            dataIndex="project"
            cell={(project: NameAlias) => {
              let text = project.name;
              if (project.alias) {
                text = `${project.name}(${project.alias})`;
              }
              return <Link to={`/projects/${project.name}`}>{text}</Link>;
            }}
          />
          <Table.Column
            key={'createTime'}
            title="CreateTime"
            dataIndex="createTime"
            width={160}
            cell={(v: string) => {
              return momentDate(v);
            }}
          />
          <Table.Column
            key={'runs'}
            title="Recent Runs(Last 7-Days)"
            dataIndex="info.runStat"
            width={'280px'}
            cell={(runState: { activeNum: number; total: RunStateInfo; week?: RunStateInfo[] }) => {
              if (!runState) {
                return '-';
              }
              return (
                <div className="run-state">
                  <div className="week">
                    {runState.week?.map((day) => {
                      const failure = day.total == 0 ? 0 : Math.floor((day.fail / day.total) * 100);
                      const success = 100 - failure;
                      return (
                        <Balloon
                          trigger={
                            <div className="rectangle">
                              <If condition={day.total > 0}>
                                <span className="failure" style={{ height: `${failure}%` }} />
                                <span className="success" style={{ height: `${success}%` }} />
                              </If>
                              <If condition={day.total == 0}>
                                <span style={{ height: `10px` }} />
                              </If>
                            </div>
                          }
                        >
                          <If condition={day.total == 0}>No Run</If>
                          <If condition={day.total > 0}>
                            <p>Total: {day.total}</p>
                            <p>Success: {day.success}</p>
                          </If>
                        </Balloon>
                      );
                    })}
                  </div>
                  <If condition={runState.total.total > 0}>
                    <div className="active">
                      <span>{runState.total.total}</span>
                    </div>
                  </If>
                </div>
              );
            }}
          />
          <Table.Column
            key={'lastRun'}
            title="Last Run"
            dataIndex="info.lastRun"
            cell={(run?: PipelineRun) => {
              if (run) {
                return (
                  <div className="last-run">
                    <div className="metadata">
                      <Link
                        to={`/projects/${run.project.name}/pipelines/${run.pipelineName}/runs/${run.pipelineRunName}`}
                      >
                        {run.pipelineRunName}
                      </Link>
                      <span>{beautifyTime(run.status?.startTime)}</span>
                    </div>
                    <RunStatusIcon runStatus={run.status} />
                  </div>
                );
              }
              return <span style={{ color: 'var(--grey-400)' }}>This Pipeline never ran.</span>;
            }}
          />
          <Table.Column
            key={'actions'}
            title="Actions"
            dataIndex="name"
            width={'360px'}
            cell={(name: string, i: number, pipeline: Pipeline) => {
              return (
                <div>
                  <Permission
                    project={pipeline.project.name}
                    resource={{
                      resource: `project:${pipeline.project.name}/pipeline:${pipeline.name}`,
                      action: 'run',
                    }}
                  >
                    <Button
                      text
                      size={'medium'}
                      ghost={true}
                      component={'a'}
                      onClick={() => {
                        this.onRunPipeline(pipeline);
                      }}
                    >
                      <AiFillCaretRight /> <Translation>Run</Translation>
                    </Button>
                    <span className="line" />
                  </Permission>
                  <Permission
                    project={pipeline.project.name}
                    resource={{
                      resource: `project:${pipeline.project.name}/pipeline:${pipeline.name}/pipelineRun:*`,
                      action: 'list',
                    }}
                  >
                    <Button
                      text
                      size={'medium'}
                      ghost={true}
                      component={'a'}
                      onClick={() => {
                        this.onShowPipelineRuns(pipeline);
                      }}
                    >
                      <HiViewList />
                      <Translation>View Runs</Translation>
                    </Button>
                    <span className="line" />
                  </Permission>
                  <Permission
                    project={pipeline.project.name}
                    resource={{
                      resource: `project:${pipeline.project.name}/pipeline:*`,
                      action: 'create',
                    }}
                  >
                    <Button
                      text
                      size={'medium'}
                      ghost={true}
                      component={'a'}
                      onClick={() => {
                        this.onClonePipeline(pipeline);
                      }}
                    >
                      <BiCopyAlt /> <Translation>Clone</Translation>
                    </Button>
                    <span className="line" />
                  </Permission>
                  <Permission
                    project={pipeline.project.name}
                    resource={{
                      resource: `project:${pipeline.project.name}/pipeline:${pipeline.name}`,
                      action: 'delete',
                    }}
                  >
                    <Button
                      text
                      size={'medium'}
                      ghost={true}
                      className={'danger-btn'}
                      component={'a'}
                      onClick={() => {
                        this.onDeletePipeline(pipeline);
                      }}
                    >
                      <AiFillDelete />
                      <Translation>Remove</Translation>
                    </Button>
                  </Permission>
                </div>
              );
            }}
          />
        </Table>
      </div>
    );
  };

  render() {
    const { userInfo } = this.props;
    const {
      showMode,
      isLoading,
      showRunPipeline,
      pipeline,
      showRuns,
      showNewPipeline,
      showClonePipeline,
    } = this.state;
    const { enabledAddons } = this.props;
    const addonEnabled = enabledAddons?.filter((addon) => addon.name == 'vela-workflow').length;
    return (
      <div>
        <Title
          title="Pipelines"
          subTitle="Orchestrate your multiple cloud native app release processes or model your cloud native pipeline."
          extButtons={[
            <Permission
              request={{ resource: 'project:?/pipeline:*', action: 'create' }}
              project={'?'}
            >
              <If condition={addonEnabled}>
                <Button
                  type="primary"
                  onClick={() => {
                    this.setState({ showNewPipeline: true });
                  }}
                >
                  <Translation>New Pipeline</Translation>
                </Button>
              </If>
            </Permission>,
          ]}
        />

        <SelectSearch
          projects={userInfo?.projects}
          showMode={showMode}
          setMode={(mode: ShowMode) => {
            this.setState({ showMode: mode });
            if (mode) {
              localStorage.setItem('application-list-mode', mode);
            }
          }}
          getPipelines={(params: any) => {
            this.getPipelines(params);
          }}
        />
        <If condition={addonEnabled}>
          <Loading style={{ width: '100%' }} visible={isLoading}>
            {this.renderPipelineTable()}
          </Loading>
        </If>
        <If condition={!addonEnabled}>
          <div className="addon-notice">
            Please enable the <Link to="/addons/vela-workflow">vela-workflow</Link> Addon that
            powers Pipeline.
          </div>
        </If>

        <If condition={showRunPipeline}>
          {pipeline && (
            <RunPipeline
              onClose={() => {
                this.setState({ showRunPipeline: false, pipeline: undefined });
              }}
              onSuccess={(runName) => {
                this.props.dispatch(
                  routerRedux.push(
                    `/projects/${pipeline.project.name}/pipelines/${pipeline.name}/runs/${runName}`,
                  ),
                );
              }}
              pipeline={pipeline}
            />
          )}
        </If>

        <If condition={showRuns}>
          {pipeline && (
            <ViewRuns
              pipeline={pipeline}
              onClose={() => {
                this.setState({ showRuns: false, pipeline: undefined });
              }}
            />
          )}
        </If>
        <If condition={showNewPipeline}>
          <CreatePipeline
            onClose={() => {
              this.setState({ showNewPipeline: false, pipeline: undefined });
            }}
            onSuccess={() => {
              this.getPipelines({});
              this.setState({ showNewPipeline: false, pipeline: undefined });
            }}
            pipeline={pipeline}
          />
        </If>

        <If condition={showClonePipeline}>
          <ClonePipeline
            onClose={() => {
              this.setState({ showClonePipeline: false, pipeline: undefined });
            }}
            onSuccess={() => {
              this.getPipelines({});
              this.setState({ showClonePipeline: false, pipeline: undefined });
            }}
            pipeline={pipeline}
          />
        </If>
      </div>
    );
  }
}

export default PipelineListPage;
