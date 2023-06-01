import { Table, Card, Loading, Balloon, Button, Message, Dialog, Tag, Tab } from '@alifd/next';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React from 'react';

import { deployApplication } from '../../api/application';
import { listApplicationResourceTree, listApplicationServiceAppliedResources } from '../../api/observation';
import { If } from '../../components/If';
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
 AppliedResource , Target , LoginUserInfo } from '@velaux/data';
import type { APIError } from '../../utils/errors';
import { handleError } from '../../utils/errors';
import { locale } from '../../utils/locale';
import { checkPermission } from '../../utils/permission';
import Header from '../ApplicationInstanceList/components/Header';

import './index.less';
import ApplicationGraph from './components/ApplicationGraph';
import { AiOutlineQuestionCircle } from 'react-icons/ai';

type Props = {
  dispatch: ({}) => {};
  match: {
    params: {
      envName: string;
      appName: string;
    };
  };
  location: { pathname: string };
  applicationDetail?: ApplicationDetail;
  applicationStatus?: ApplicationStatus;
  components?: ApplicationComponent[];
  envbinding: EnvBinding[];
  userInfo?: LoginUserInfo;
};

type State = {
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
      mode: 'resource-graph',
      resources: [],
    };
  }

  componentDidMount() {
    this.loadApplicationStatus();
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

  loadApplicationStatus = async () => {
    const {
      params: { appName, envName },
    } = this.props.match;
    if (envName) {
      this.props.dispatch({
        type: 'application/getApplicationStatus',
        payload: { appName: appName, envName: envName },
        callback: (res: any) => {
          if (res.status) {
            this.loadApplicationAppliedResources();
          }
        },
      });
    }
  };

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

  loadApplicationAppliedResources = async () => {
    const { mode } = this.state;
    if (mode === 'resource-graph') {
      await this.loadResourceTree();
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
      this.setState({ resourceLoading: true });
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

  loadResourceTree = async () => {
    const { applicationDetail } = this.props;
    const env = this.getEnvbindingByName();
    const { target, componentName, resourceLoading } = this.state;
    const {
      params: { appName },
    } = this.props.match;
    if (applicationDetail && applicationDetail.name && env && !resourceLoading) {
      const param = {
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
      this.setState({ resourceLoading: true });
      listApplicationResourceTree(param)
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
            Message.success(i18n.t('Application deployed successfully'));
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
            disableStatusShow={true}
            applicationDetail={applicationDetail}
            applicationStatus={applicationStatus}
            components={components}
            updateQuery={(params: { target?: string; component?: string }) => {
              this.updateQuery(params);
            }}
            refresh={() => {
              this.loadApplicationStatus();
            }}
            dispatch={this.props.dispatch}
          />
        </Loading>
        <Tab onChange={this.onChangeMode} defaultActiveKey={mode} shape="capsule">
          <Tab.Item title={i18n.t('Overview').toString()} key="overview">
            <Loading visible={loading && resourceLoading} style={{ width: '100%' }}>
              <If condition={applicationStatus}>
                <If condition={componentStatus}>
                  <Card
                    locale={locale().Card}
                    style={{ marginTop: '8px', marginBottom: '16px' }}
                    contentHeight="auto"
                    title={<Translation>Component Status</Translation>}
                  >
                    <div style={{ overflow: 'auto' }}>
                      <Table
                        locale={locale().Table}
                        className="customTable"
                        dataSource={componentStatus}
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
                          width="100px"
                          cell={(v: boolean) => {
                            if (v) {
                              return (
                                <div>
                                  <span className="circle circle-success" />
                                  <span>Healthy</span>
                                </div>
                              );
                            }
                            return (
                              <div>
                                <span className="circle circle-warning" />
                                <span>UnHealthy</span>
                              </div>
                            );
                          }}
                          title={<Translation>Healthy</Translation>}
                        />
                        <Table.Column
                          align="left"
                          dataIndex="trait"
                          cell={(v: boolean, i: number, record: ComponentStatus) => {
                            const { traits } = record;
                            const Tags = (traits || []).map((item) => {
                              if (item.healthy) {
                                return (
                                  <Tag type="normal" size="small">
                                    <div>
                                      <span className="circle circle-success" />
                                      <span>{item.type}</span>
                                    </div>
                                  </Tag>
                                );
                              } else {
                                return (
                                  <Tag type="normal" size="small">
                                    <div>
                                      <span className="circle circle-failure" />
                                      <span>{item.type}</span>
                                    </div>
                                  </Tag>
                                );
                              }
                            });
                            return <TagGroup className="tags-content">{Tags}</TagGroup>;
                          }}
                          title={<Translation>Traits</Translation>}
                        />
                        <Table.Column
                          align="center"
                          dataIndex="message"
                          title={<Translation>Message</Translation>}
                          cell={(v: string, i: number, record: ComponentStatus) => {
                            const { message = '', traits } = record;
                            const TraitMessages = (traits || []).map((item) => {
                              if (item.message) {
                                return (
                                  <div>
                                    <span>{item.type}: </span>
                                    <span>{item.message}</span>
                                  </div>
                                );
                              }
                              return;
                            });
                            return (
                              <div>
                                <div>{message}</div>
                                {TraitMessages}
                              </div>
                            );
                          }}
                        />
                      </Table>
                    </div>
                  </Card>
                </If>
                <Card locale={locale().Card} contentHeight="200px" title={<Translation>Applied Resources</Translation>}>
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
                                <span
                                  style={{
                                    background: 'var(--success-color)',
                                    padding: '4px',
                                    fontSize: '12px',
                                    color: '#fff',
                                    marginRight: '4px',
                                  }}
                                >
                                  NEW
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
                </Card>

                <If condition={applicationStatus?.conditions}>
                  <Card
                    locale={locale().Card}
                    style={{ marginTop: '8px' }}
                    contentHeight="auto"
                    title={<Translation>Conditions</Translation>}
                  >
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
                  </Card>
                </If>
              </If>
              <If condition={!applicationStatus}>{notDeploy}</If>
            </Loading>
          </Tab.Item>
          <Tab.Item title={i18n.t('Resource Graph').toString()} key="resource-graph">
            <Loading visible={loading && resourceLoading} style={{ width: '100%' }}>
              <If condition={applicationStatus}>
                <ApplicationGraph
                  applicationStatus={applicationStatus}
                  application={applicationDetail}
                  env={env}
                  resources={resources}
                  graphType="resource-graph"
                />
              </If>
            </Loading>
            <If condition={!applicationStatus}>{notDeploy}</If>
          </Tab.Item>
          <Tab.Item title={i18n.t('Application Graph').toString()} key="application-graph">
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
          </Tab.Item>
        </Tab>
      </div>
    );
  }
}

export default ApplicationStatusPage;
