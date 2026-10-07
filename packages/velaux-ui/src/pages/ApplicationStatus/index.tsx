import { Table, Loading, Balloon, Button, Message, Dialog, Tag } from '@alifd/next';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React from 'react';

import { deployApplication } from '../../api/application';
import { notifyDeployed } from '../../utils/deploy';
import { listEnvResourceTree, listApplicationServiceAppliedResources } from '../../api/observation';
import { If } from '../../components/If';
import { StatusBadge } from '../../components/StatusBadge';
import { StatusDetails } from '../../components/StatusDetails';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type {
  ApplicationComponent,
  ApplicationDetail,
  ApplicationStatus,
  Condition,
  EnvBinding,
  ComponentStatus,
  ApplicationDeployResponse,
  AppliedResource,
  Target,
  LoginUserInfo,
} from '@velaux/data';
import type { APIError } from '../../utils/errors';
import { handleError } from '../../utils/errors';
import { locale } from '../../utils/locale';
import { checkPermission } from '../../utils/permission';
import { componentStatusKey, hasStatusDetails, traitState, traitStateCircle } from '../../utils/status';
import { statusMode } from '../../layout/Application/components/AppTabs/add';
import Header from '../ApplicationInstanceList/components/Header';

import './index.less';
import ApplicationGraph from './components/ApplicationGraph';
import SourceStatusList from './components/SourceStatusList';
import Reconciliation from './components/Reconciliation';
import { AiOutlineQuestionCircle } from 'react-icons/ai';

type Props = {
  dispatch: ({}) => {};
  match: {
    params: {
      envName: string;
      appName: string;
      view?: string;
    };
  };
  location: { pathname: string };
  applicationDetail?: ApplicationDetail;
  applicationStatus?: ApplicationStatus;
  components?: ApplicationComponent[];
  envbinding: EnvBinding[];
  userInfo?: LoginUserInfo;
};

// refreshInterval is how often the status reloads while the page is visible.
const refreshInterval = 15000;

// RefreshedAt says the status reloads by itself, and how long ago it last did.
const RefreshedAt = (props: { at?: number }) => {
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(timer);
  }, []);
  if (!props.at) {
    return null;
  }
  const seconds = Math.max(0, Math.round((Date.now() - props.at) / 1000));
  return (
    <span
      className="status-refreshed"
      title={i18n.t('The status reloads every 15 seconds while this page is open').toString()}
    >
      <span className="status-refreshed-dot" />
      <Translation>Updated</Translation> {seconds < 5 ? i18n.t('just now') : `${seconds}s ${i18n.t('ago')}`}
    </span>
  );
};

type State = {
  // refreshedAt is when the status last loaded.
  refreshedAt?: number;
  loading: boolean;
  target?: Target;
  componentName?: string;
  resources: AppliedResource[];
  deployLoading: boolean;
  resourceLoading: boolean;
  endpointLoading: boolean;
  envName: string;
  mode: 'overview' | 'resource-graph' | 'application-graph' | string;
};

@connect((store: any) => {
  return { ...store.application, ...store.user };
})
class ApplicationStatusPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
      deployLoading: false,
      resourceLoading: false,
      endpointLoading: false,
      envName: '',
      mode: statusMode(props.match.params.view),
      resources: [],
    };
  }

  componentDidMount() {
    this.loadApplicationStatus();
    this.refreshTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.loadApplicationStatus(true);
      }
    }, refreshInterval);
  }

  componentWillUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  componentDidUpdate(prev: Props) {
    if (prev.match.params.view !== this.props.match.params.view) {
      this.onChangeMode(statusMode(this.props.match.params.view));
    }
  }

  componentWillReceiveProps(nextProps: any) {
    const { params } = nextProps.match;
    if (params.envName !== this.state.envName) {
      this.setState({ envName: params.envName }, () => {
        this.loadApplicationStatus();
      });
      return;
    }
    if (this.props.envbinding.length != nextProps.envbinding.length) {
      this.loadApplicationStatus();
    }
  }

  // loadApplicationStatus loads the env's status and resources; a silent load,
  // the periodic refresh, keeps the page as it is while it runs.
  loadApplicationStatus = async (silent = false) => {
    const {
      params: { appName, envName },
    } = this.props.match;
    if (envName) {
      this.props.dispatch({
        type: 'application/getApplicationStatus',
        payload: { appName: appName, envName: envName },
        callback: (res: any) => {
          this.setState({ refreshedAt: Date.now() });
          if (res.status) {
            this.loadApplicationAppliedResources(silent);
          }
        },
      });
    }
  };

  // refreshTimer reloads the status while the page is visible.
  refreshTimer?: ReturnType<typeof setInterval>;

  getTargets = () => {
    const { envbinding, match } = this.props;
    const env = envbinding.filter((item) => item.name == match.params.envName);
    if (env.length > 0) {
      return env[0].targets;
    }
    return [];
  };

  getEnvbindingByName = () => {
    const { envbinding } = this.props;
    const {
      params: { envName },
    } = this.props.match;
    return envbinding.find((env) => env.name === envName);
  };

  loadApplicationAppliedResources = async (silent = false) => {
    const { mode } = this.state;
    if (mode === 'resource-graph') {
      await this.loadResourceTree(silent);
      return;
    }
    const { applicationDetail } = this.props;
    const {
      params: { appName },
    } = this.props.match;
    const { target, componentName } = this.state;
    const env = this.getEnvbindingByName();
    if (applicationDetail && applicationDetail.name && env) {
      const param = {
        project: applicationDetail?.project?.name || '',
        appName: env.appDeployName || appName,
        appNs: env.appDeployNamespace,
        componentName: componentName,
        cluster: '',
        clusterNs: '',
      };
      if (target) {
        param.cluster = target.cluster?.clusterName || '';
        param.clusterNs = target.cluster?.namespace || '';
      }
      if (!silent) {
        this.setState({ resourceLoading: true });
      }
      listApplicationServiceAppliedResources(param)
        .then((re) => {
          if (re && re.resources) {
            this.setState({ resources: re.resources });
          } else {
            this.setState({ resources: [] });
          }
        })
        .finally(() => {
          this.setState({ resourceLoading: false });
        });
    }
  };

  loadResourceTree = async (silent = false) => {
    const { applicationDetail } = this.props;
    const env = this.getEnvbindingByName();
    const { target, componentName, resourceLoading } = this.state;
    const {
      params: { appName },
    } = this.props.match;
    if (applicationDetail && applicationDetail.name && env && !resourceLoading) {
      const param = {
        appName: appName,
        envName: env.name,
        componentName: componentName,
        cluster: '',
        clusterNs: '',
      };
      if (target) {
        param.cluster = target.cluster?.clusterName || '';
        param.clusterNs = target.cluster?.namespace || '';
      }
      if (!silent) {
        this.setState({ resourceLoading: true });
      }
      listEnvResourceTree(param)
        .then((re) => {
          if (re && re.resources) {
            this.setState({ resources: re.resources });
          } else {
            this.setState({ resources: [] });
          }
        })
        .finally(() => {
          this.setState({ resourceLoading: false });
        });
    }
  };

  updateQuery = (params: { target?: string; component?: string }) => {
    const targets = this.getTargets()?.filter((item) => item.name == params.target);
    let target: Target | undefined = undefined;
    if (targets && targets.length > 0) {
      target = targets[0];
    }
    this.setState({ target: target, componentName: params.component }, () => {
      this.loadApplicationAppliedResources();
    });
  };

  onDeploy = (force?: boolean) => {
    const { envbinding, dispatch } = this.props;
    const {
      params: { appName, envName },
    } = this.props.match;
    const envs = envbinding.filter((item) => item.name == envName);
    if (envs) {
      this.setState({ deployLoading: true });
      deployApplication(
        {
          appName: appName,
          workflowName: 'workflow-' + envs[0].name,
          triggerType: 'web',
          force: force || false,
        },
        true
      )
        .then((re: ApplicationDeployResponse) => {
          if (re) {
            notifyDeployed(re);
            this.setState({ deployLoading: false });
            this.loadApplicationStatus();
            if (re.record && re.record.name && dispatch) {
              dispatch(
                routerRedux.push(`/applications/${appName}/envbinding/${re.envName}/workflow/records/${re.record.name}`)
              );
            }
          }
        })
        .catch((err: APIError) => {
          if (err.BusinessCode === 10004) {
            Dialog.confirm({
              content: i18n.t('Workflow is executing. Do you want to force a restart?').toString(),
              onOk: () => {
                this.onDeploy(true);
              },
              onCancel: () => {
                this.setState({ deployLoading: false });
              },
              locale: locale().Dialog,
            });
          } else {
            handleError(err);
          }
        });
    } else {
      Message.warning(i18n.t('Please wait'));
    }
  };

  onChangeMode = (mode: string) => {
    this.setState({ mode: mode }, () => {
      if (mode === 'overview' || mode === 'resource-graph') {
        this.loadApplicationAppliedResources();
      }
    });
  };

  render() {
    const { applicationStatus, applicationDetail, components, userInfo } = this.props;
    const {
      params: { appName, envName },
    } = this.props.match;
    const { loading, endpointLoading, resourceLoading, resources, componentName, deployLoading, mode } = this.state;
    let componentStatus = applicationStatus?.services;
    if (componentName) {
      componentStatus = componentStatus?.filter((item) => item.name == componentName);
    }
    const env = this.getEnvbindingByName();
    const { Group: TagGroup } = Tag;
    const notDeploy = (
      <div className="deployNotice">
        <div className="noticeBox">
          <h2>
            <Translation>Not Deploy</Translation>
          </h2>
          <div className="desc">
            <Translation>The current environment has not been deployed.</Translation>
          </div>
          <div className="noticeAction">
            <Button
              loading={deployLoading}
              disabled={applicationDetail?.readOnly}
              onClick={() => this.onDeploy()}
              type="primary"
            >
              <Translation>Deploy</Translation>
            </Button>
          </div>
        </div>
      </div>
    );
    return (
      <div className="application-status-wrapper">
        <Loading visible={loading && endpointLoading} style={{ width: '100%' }}>
          <Header
            userInfo={userInfo}
            envbinding={this.getEnvbindingByName()}
            targets={this.getTargets()}
            envName={envName}
            appName={appName}
            applicationDetail={applicationDetail}
            applicationStatus={applicationStatus}
            components={components}
            updateQuery={(params: { target?: string; component?: string }) => {
              this.updateQuery(params);
            }}
            extra={<RefreshedAt at={this.state.refreshedAt} />}
            refresh={() => {
              this.loadApplicationStatus();
            }}
            dispatch={this.props.dispatch}
          />
        </Loading>
        {mode === 'overview' && (
          <>
            <Loading visible={loading && resourceLoading} style={{ width: '100%' }}>
              <If condition={applicationStatus}>
                {applicationStatus && (
                  <section className="status-section">
                    <div className="status-section-title">
                      <Translation>Reconciliation</Translation>
                    </div>
                    <Reconciliation
                      appName={appName}
                      envName={envName}
                      projectName={applicationDetail?.project?.name}
                      status={applicationStatus}
                      onChanged={this.loadApplicationStatus}
                      readOnly={applicationDetail?.readOnly}
                    />
                  </section>
                )}
                <If condition={componentStatus}>
                  <section className="status-section">
                    <div className="status-section-title">
                      <Translation>Component Status</Translation>
                    </div>
                    <div style={{ overflow: 'auto' }}>
                      <Table
                        locale={locale().Table}
                        className="customTable"
                        dataSource={componentStatus?.map((item) => ({ ...item, statusKey: componentStatusKey(item) }))}
                        primaryKey="statusKey"
                        rowExpandable={hasStatusDetails}
                        expandedRowRender={(record: ComponentStatus) => <StatusDetails status={record} />}
                        style={{ minWidth: '1000px' }}
                      >
                        <Table.Column
                          align="left"
                          dataIndex="name"
                          style={{ width: '17%' }}
                          title={<Translation>Name</Translation>}
                        />
                        <Table.Column
                          dataIndex="cluster"
                          title={<Translation>Cluster</Translation>}
                          width="200px"
                          cell={(v: string) => {
                            let clusterName = v;
                            if (!clusterName) {
                              clusterName = 'Local';
                            }
                            if (
                              checkPermission(
                                { resource: 'cluster:*', action: 'list' },
                                applicationDetail?.project?.name,
                                userInfo
                              )
                            ) {
                              return <Link to="/clusters">{clusterName}</Link>;
                            }
                            return <span>{clusterName}</span>;
                          }}
                        />
                        <Table.Column
                          align="left"
                          dataIndex="healthy"
                          width="130px"
                          cell={(v: boolean) =>
                            v ? (
                              <StatusBadge tone="healthy" label="Healthy" />
                            ) : (
                              <StatusBadge tone="unhealthy" label="Unhealthy" />
                            )
                          }
                          title={<Translation>Healthy</Translation>}
                        />
                        <Table.Column
                          align="left"
                          dataIndex="trait"
                          cell={(v: boolean, i: number, record: ComponentStatus) => {
                            const { traits } = record;
                            const Tags = (traits || []).map((item, index) => {
                              const state = traitState(item);
                              const tag = (
                                <Tag type="normal" size="small" key={`${item.type}-${index}`}>
                                  <div>
                                    <span className={`circle ${traitStateCircle[state]}`} />
                                    <span>{item.type}</span>
                                  </div>
                                </Tag>
                              );
                              // A trait's message is on its tag; a pending trait without one says what it waits for.
                              const note =
                                item.message ||
                                (state === 'pending' ? i18n.t('Pending: waits for the workload to be healthy') : '');
                              if (!note) {
                                return tag;
                              }
                              return (
                                <Balloon.Tooltip key={`${item.type}-${index}`} trigger={tag} align="t">
                                  {note}
                                </Balloon.Tooltip>
                              );
                            });
                            return <TagGroup className="tags-content">{Tags}</TagGroup>;
                          }}
                          title={<Translation>Traits</Translation>}
                        />
                        <Table.Column
                          dataIndex="message"
                          title={<Translation>Message</Translation>}
                          cell={(v: string, i: number, record: ComponentStatus) => <div>{record.message || ''}</div>}
                        />
                      </Table>
                    </div>
                  </section>
                </If>
                <If condition={applicationStatus?.sources?.length}>
                  <section className="status-section">
                    <div className="status-section-title">
                      <Translation>Sources</Translation>
                    </div>
                    <SourceStatusList sources={applicationStatus?.sources || []} />
                  </section>
                </If>
                <section className="status-section">
                  <div className="status-section-title">
                    <Translation>Applied Resources</Translation>
                  </div>
                  <div style={{ overflow: 'auto' }}>
                    <Table style={{ minWidth: '1000px' }} locale={locale().Table} dataSource={resources}>
                      <Table.Column
                        dataIndex="name"
                        width="240px"
                        title={<Translation>Namespace/Name</Translation>}
                        cell={(v: string, i: number, row: AppliedResource) => {
                          return `${row.namespace || '-'}/${row.name}`;
                        }}
                      />
                      <Table.Column
                        dataIndex="cluster"
                        title={<Translation>Cluster</Translation>}
                        width="200px"
                        cell={(v: string) => {
                          let clusterName = v;
                          if (!clusterName) {
                            clusterName = 'Local';
                          }
                          if (
                            checkPermission(
                              { resource: 'cluster:*', action: 'list' },
                              applicationDetail?.project?.name,
                              userInfo
                            )
                          ) {
                            return <Link to="/clusters">{clusterName}</Link>;
                          }
                          return <span>{clusterName}</span>;
                        }}
                      />
                      <Table.Column width="200px" dataIndex="kind" title={<Translation>Kind</Translation>} />
                      <Table.Column dataIndex="apiVersion" title={<Translation>APIVersion</Translation>} />
                      <Table.Column dataIndex="component" title={<Translation>Component</Translation>} />
                      <Table.Column
                        dataIndex="deployVersion"
                        title={<Translation>Revision</Translation>}
                        cell={(v: string, i: number, row: AppliedResource) => {
                          if (row.latest) {
                            return (
                              <span>
                                <span className="status-latest">
                                  <Translation>Latest</Translation>
                                </span>
                                <Link to={`/applications/${applicationDetail?.name}/revisions`}>{v}</Link>
                              </span>
                            );
                          }
                          return <Link to={`/applications/${applicationDetail?.name}/revisions`}>{v}</Link>;
                        }}
                      />
                    </Table>
                  </div>
                </section>

                <If condition={applicationStatus?.conditions}>
                  <section className="status-section">
                    <div className="status-section-title">
                      <Translation>Conditions</Translation>
                    </div>
                    <div style={{ overflow: 'auto' }}>
                      <Table
                        style={{ minWidth: '1000px' }}
                        locale={locale().Table}
                        dataSource={applicationStatus?.conditions}
                      >
                        <Table.Column width="150px" dataIndex="type" title={<Translation>Type</Translation>} />
                        <Table.Column dataIndex="status" title={<Translation>Status</Translation>} />

                        <Table.Column
                          dataIndex="lastTransitionTime"
                          title={<Translation>LastTransitionTime</Translation>}
                        />
                        <Table.Column
                          dataIndex="reason"
                          title={<Translation>Reason</Translation>}
                          cell={(v: string, index: number, row: Condition) => {
                            if (row.message) {
                              return (
                                <Balloon
                                  trigger={
                                    <span style={{ color: 'red', cursor: 'pointer' }}>
                                      {v} <AiOutlineQuestionCircle size={14} />
                                    </span>
                                  }
                                >
                                  {row.message}
                                </Balloon>
                              );
                            }
                            return <span>{v}</span>;
                          }}
                        />
                      </Table>
                    </div>
                  </section>
                </If>
              </If>
              <If condition={!applicationStatus}>{notDeploy}</If>
            </Loading>
          </>
        )}
        {mode === 'resource-graph' && (
          <>
            <Loading visible={loading && resourceLoading} style={{ width: '100%' }}>
              <If condition={applicationStatus}>
                <ApplicationGraph
                  applicationStatus={applicationStatus}
                  application={applicationDetail}
                  env={env}
                  resources={resources}
                  components={components}
                  graphType="resource-graph"
                />
              </If>
            </Loading>
            <If condition={!applicationStatus}>{notDeploy}</If>
          </>
        )}
        {mode === 'application-graph' && (
          <>
            <Loading visible={loading && resourceLoading} style={{ width: '100%' }}>
              <If condition={applicationStatus}>
                <ApplicationGraph
                  applicationStatus={applicationStatus}
                  application={applicationDetail}
                  env={env}
                  resources={resources}
                  components={components}
                  graphType="application-graph"
                />
              </If>
            </Loading>
            <If condition={!applicationStatus}>{notDeploy}</If>
          </>
        )}
      </div>
    );
  }
}

export default ApplicationStatusPage;
