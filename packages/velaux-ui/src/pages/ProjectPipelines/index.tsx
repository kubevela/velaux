import { Loading, Button, Table, Dialog, Message, Balloon } from '@alifd/next';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Component } from 'react';
import { AiFillCaretRight, AiFillDelete } from 'react-icons/ai';
import { BiCopyAlt } from 'react-icons/bi';
import { HiViewList } from 'react-icons/hi';
import type { Dispatch } from 'redux';

import { deletePipeline, listPipelines } from '../../api/pipeline';
import { If } from '../../components/If';
import { ListTitle as Title } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import RunPipeline from '../../components/RunPipeline';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { AddonBaseStatus , NameAlias , PipelineBase, PipelineListItem, PipelineRun, RunStateInfo , LoginUserInfo } from '@velaux/data';
import { beautifyTime, momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';
import CreatePipeline from '../PipelineListPage/components/CreatePipeline';
import ClonePipeline from '../PipelineListPage/components/PipelineClone';
import SelectSearch from '../PipelineListPage/components/SelectSearch';
import ViewRuns from '../PipelineListPage/components/ViewRuns';
import RunStatusIcon from '../PipelineRunPage/components/RunStatusIcon';

type Props = {
  match: {
    params: {
      projectName: string;
    };
  };
  userInfo?: LoginUserInfo;
  dispatch: Dispatch<any>;
  enabledAddons?: AddonBaseStatus[];
};

export type ShowMode = 'table' | 'card' | string | null;

type State = {
  isLoading: boolean;
  editItem?: PipelineListItem;
  pipelines?: PipelineListItem[];
  showMode: ShowMode;
  showRunPipeline?: boolean;
  pipeline?: PipelineListItem;
  showRuns?: boolean;
  showNewPipeline?: boolean;
  showClonePipeline?: boolean;
};

@connect((store: any) => {
  return { ...store.user, ...store.addons };
})
class ProjectPipelines extends Component<Props, State> {
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

  getPipelines = async (params: { query?: string }) => {
    const {
      match: {
        params: { projectName },
      },
    } = this.props;
    this.setState({ isLoading: true });
    listPipelines({ projectName, query: params.query })
      .then((res) => {
        this.setState({
          pipelines: res && Array.isArray(res.pipelines) ? res.pipelines : [],
        });
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  };

  onShowPipelineRuns = (pipeline: PipelineListItem) => {
    this.setState({ showRuns: true, pipeline: pipeline });
  };

  onRunPipeline = (pipeline: PipelineListItem) => {
    this.setState({ pipeline: pipeline, showRunPipeline: true });
  };

  onClonePipeline = (pipeline: PipelineListItem) => {
    this.setState({ pipeline, showClonePipeline: true });
  };

  onDeletePipeline = (pipeline: PipelineListItem) => {
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
            title={i18n.t('Name(Alias)').toString()}
            dataIndex="name"
            cell={(name: string, i: number, pipeline: PipelineListItem) => {
              let text = name;
              if (pipeline.alias) {
                text = `${name}(${pipeline.alias})`;
              }
              return (
                <div className="pipeline-name">
                  <Link to={`/projects/${pipeline.project.name}/pipelines/${pipeline.name}/studio`}>{text}</Link>
                  <span>{pipeline.description}</span>
                </div>
              );
            }}
          />
          <Table.Column
            key={'project'}
            title={i18n.t('Project').toString()}
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
            title={i18n.t('CreateTime').toString()}
            dataIndex="createTime"
            width={160}
            cell={(v: string) => {
              return momentDate(v);
            }}
          />
          <Table.Column
            key={'runs'}
            title={i18n.t('Recent Runs(Last 7-Days)').toString()}
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
            title={i18n.t('Last Run').toString()}
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
                    <RunStatusIcon status={run.status?.status} />
                  </div>
                );
              }
              return <span style={{ color: 'var(--grey-400)' }}>This Pipeline never ran.</span>;
            }}
          />
          <Table.Column
            key={'actions'}
            title={i18n.t('Actions').toString()}
            dataIndex="name"
            width={'360px'}
            cell={(name: string, i: number, pipeline: PipelineListItem) => {
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
      match: {
        params: { projectName },
      },
    } = this.props;
    const { showMode, isLoading, showRunPipeline, pipeline, showRuns, showNewPipeline, showClonePipeline } = this.state;
    const { enabledAddons } = this.props;
    const addonEnabled = enabledAddons?.filter((addon) => addon.name == 'vela-workflow').length;
    return (
      <div>
        <Title
          title=""
          subTitle=""
          extButtons={[
            <Permission
              request={{ resource: `project:${projectName}/pipeline:*`, action: 'create' }}
              project={projectName}
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
          disableProject={true}
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
          <Permission request={{ resource: 'addon', action: 'enable' }}>
            <div className="addon-notice">
              Please enable the <Link to="/addons/vela-workflow">vela-workflow</Link> addon to power pipeline.
            </div>
          </Permission>
        </If>

        <If condition={showRunPipeline}>
          {pipeline && (
            <RunPipeline
              onClose={() => {
                this.setState({ showRunPipeline: false, pipeline: undefined });
              }}
              onSuccess={(runName) => {
                this.props.dispatch(
                  routerRedux.push(`/projects/${pipeline.project.name}/pipelines/${pipeline.name}/runs/${runName}`)
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
            onSuccess={(p: PipelineBase) => {
              this.props.dispatch(routerRedux.push(`/projects/${p.project.name}/pipelines/${p.name}/studio`));
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

export default ProjectPipelines;
