import React from 'react';
import { connect } from 'dva';

import {
  Table,
  Card,
  Loading,
  Balloon,
  Icon,
  Button,
  Message,
  Dialog,
  Tag,
  Tab,
} from '@b-design/ui';
import type {
  ApplicationComponent,
  ApplicationDetail,
  ApplicationStatus,
  Condition,
  EnvBinding,
  ComponentStatus,
} from '../../interface/application';
import { If } from 'tsx-control-statements/components';
import Translation from '../../components/Translation';
import locale from '../../utils/locale';
import { Link } from 'dva/router';
import Header from '../ApplicationInstanceList/components/Header';
import {
  listApplicationResourceTree,
  listApplicationServiceAppliedResources,
  listApplicationServiceEndpoints,
} from '../../api/observation';
import type { Endpoint, AppliedResource } from '../../interface/observation';
import type { Target } from '../../interface/target';
import { deployApplication } from '../../api/application';
import type { APIError } from '../../utils/errors';
import { handleError } from '../../utils/errors';
import i18next from 'i18next';
import { checkPermission } from '../../utils/permission';
import type { LoginUserInfo } from '../../interface/user';
import './index.less';
import ApplicationGraph from './components/ApplicationGraph';
import i18n from '../../i18n';

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
  endpoints?: Endpoint[];
  target?: Target;
  componentName?: string;
  resources: AppliedResource[];
  componentData: ApplicationComponent[];
  deployLoading: boolean;
  resourceLoading: boolean;
  endpointLoading: boolean;
  envName: string;
  mode: 'overview' | 'resource-graph' | 'application-graph';
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
      mode: 'overview',
      resources: [],
      componentData: [],
    };
  }

  componentDidMount() {
    this.loadApplicationStatus();
  }

  buildComponentsData(components?: ApplicationComponent[]) {
    const newComponents: ApplicationComponent[] = JSON.parse(JSON.stringify(components))
    newComponents?.map((comRes) => {
      if (comRes.dependsOn !== null) {
        comRes.dependsOn.map((res) => {
          const arr = newComponents.filter((n) => {
            return n.name === res
          })
          if (arr[0].leafNodes) {
            arr[0].leafNodes.push(comRes)
          } else {
            arr[0].leafNodes = []
            arr[0].leafNodes.push(comRes)
          }
        })
      }
    })
    return newComponents
  }

  addServicesStatus(services?: ComponentStatus[], components?: ApplicationComponent[]) {
    const newData: any[] = []
    components?.map((comRes) => {
      comRes.kind = 'Component'
      const clusters: any[] = []
      services?.map((service) => {
        if (!clusters.includes(service.cluster)) {
          clusters.push(service.cluster)
        }
        clusters.map((res) => {
          if (comRes.name === service.name && res === service.cluster) {
            const newRes = {...comRes }
            newRes.service = service
            newRes.service.cluster = res
            newData.push(newRes)
          }
        })
      })
    })   
    return this.buildComponentsData(newData)
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
            this.loadApplicationEndpoints();
            this.loadApplicationAppliedResources();
            const { components } = this.props
            this.setState({ componentData: this.addServicesStatus(res.status?.services, components )})
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

  loadApplicationEndpoints = async () => {
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
      this.setState({ endpointLoading: true });
      listApplicationServiceEndpoints(param)
        .then((re) => {
          if (re && re.endpoints) {
            this.setState({ endpoints: re.endpoints });
          } else {
            this.setState({ endpoints: [] });
          }
        })
        .finally(() => {
          this.setState({ endpointLoading: false });
        });
    }
  };

  loadApplicationAppliedResources = async () => {
    const { mode } = this.state;
    if (mode === 'resource-graph' || mode === 'application-graph') {
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

  loadApplicationWorkflows = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationWorkflows',
      payload: { appName: appName },
    });
  };

  loadApplicationPolicies = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationPolicies',
      payload: { appName: appName },
    });
  };

  loadApplicationEnvbinding = async () => {
    const {
      params: { appName },
    } = this.props.match;
    if (appName) {
      this.props.dispatch({
        type: 'application/getApplicationEnvbinding',
        payload: { appName: appName },
      });
    }
  };

  updateQuery = (params: { target?: string; component?: string }) => {
    const targets = this.getTargets()?.filter((item) => item.name == params.target);
    let target = undefined;
    if (targets && targets.length > 0) {
      target = targets[0];
    }
    this.setState({ target: target, componentName: params.component }, () => {
      this.loadApplicationEndpoints();
      this.loadApplicationAppliedResources();
    });
  };

  onDeploy = (force?: boolean) => {
    const { envbinding } = this.props;
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
        true,
      )
        .then((re) => {
          if (re) {
            Message.success(i18next.t('Application deployed successfully'));
            this.setState({ deployLoading: false });
            this.loadApplicationStatus();
          }
        })
        .catch((err: APIError) => {
          if (err.BusinessCode === 10004) {
            Dialog.confirm({
              content: i18next.t('Workflow is executing. Do you want to force a restart?'),
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
      Message.warning(i18next.t('Please wait'));
    }
  };

  onChangeMode = (mode: string | number) => {
    if (mode == 'overview') {
      this.setState({ mode: mode }, () => {
        this.loadApplicationAppliedResources();
      });
    } else if (mode == 'resource-graph') {
      this.setState({ mode: mode }, () => {
        this.loadApplicationAppliedResources();
      });
    } else if (mode == 'application-graph') {
      this.loadApplicationAppliedResources();
    }
  };

  render() {
    const { applicationStatus, applicationDetail, components, userInfo } = this.props;
    const {
      params: { appName, envName },
    } = this.props.match;
    const {
      loading,
      endpointLoading,
      resourceLoading,
      endpoints,
      resources,
      componentName,
      deployLoading,
      componentData,
    } = this.state;
    let componentStatus = applicationStatus?.services;
    if (componentName) {
      componentStatus = componentStatus?.filter((item) => item.name == componentName);
    }
    const env = this.getEnvbindingByName();
    const { Group: TagGroup } = Tag;

    return (
      <div className="application-status-wrapper">
        <Loading visible={loading && endpointLoading} style={{ width: '100%' }}>
          <Header
            envbinding={this.getEnvbindingByName()}
            targets={this.getTargets()}
            envName={envName}
            appName={appName}
            disableStatusShow={true}
            endpoints={endpoints}
            applicationDetail={applicationDetail}
            applicationStatus={applicationStatus}
            components={components}
            updateEnvs={() => {
              this.loadApplicationEnvbinding();
              this.loadApplicationWorkflows();
              this.loadApplicationPolicies();
            }}
            updateQuery={(params: { target?: string; component?: string }) => {
              this.updateQuery(params);
            }}
            refresh={() => {
              this.loadApplicationStatus();
            }}
            dispatch={this.props.dispatch}
          />
        </Loading>
        <Tab onChange={this.onChangeMode} shape="capsule">
          <Tab.Item title={i18n.t('Overview')} key="overview">
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
                                userInfo,
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
                <Card
                  locale={locale().Card}
                  contentHeight="200px"
                  title={<Translation>Applied Resources</Translation>}
                >
                  <div style={{ overflow: 'auto' }}>
                    <Table
                      style={{ minWidth: '1000px' }}
                      locale={locale().Table}
                      dataSource={resources}
                    >
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
                              userInfo,
                            )
                          ) {
                            return <Link to="/clusters">{clusterName}</Link>;
                          }
                          return <span>{clusterName}</span>;
                        }}
                      />
                      <Table.Column
                        width="200px"
                        dataIndex="kind"
                        title={<Translation>Kind</Translation>}
                      />
                      <Table.Column
                        dataIndex="apiVersion"
                        title={<Translation>APIVersion</Translation>}
                      />
                      <Table.Column
                        dataIndex="component"
                        title={<Translation>Component</Translation>}
                      />
                      <Table.Column
                        dataIndex="deployVersion"
                        title={<Translation>Revision</Translation>}
                        cell={(v: string, i: number, row: AppliedResource) => {
                          if (row.latest) {
                            return (
                              <span>
                                <Icon
                                  style={{ color: 'green', marginRight: '8px' }}
                                  type="NEW"
                                  title="latest version resource"
                                />
                                <Link to={`/applications/${applicationDetail?.name}/revisions`}>
                                  {v}
                                </Link>
                              </span>
                            );
                          }
                          return (
                            <Link to={`/applications/${applicationDetail?.name}/revisions`}>
                              {v}
                            </Link>
                          );
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
                        <Table.Column
                          width="150px"
                          dataIndex="type"
                          title={<Translation>Type</Translation>}
                        />
                        <Table.Column
                          dataIndex="status"
                          title={<Translation>Status</Translation>}
                        />

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
                                      {v} <Icon size={'xs'} type="question-circle" />
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
              <If condition={!applicationStatus}>
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
              </If>
            </Loading>
          </Tab.Item>
          <Tab.Item title={i18n.t('Resource Graph')} key="resource-graph">
            <Loading visible={loading && resourceLoading} style={{ width: '100%' }}>
              <If condition={applicationStatus}>
                <ApplicationGraph
                  applicationStatus={applicationStatus}
                  application={applicationDetail}
                  env={env}
                  resources={resources}
                />
              </If>
            </Loading>
          </Tab.Item>
          <Tab.Item title={i18n.t('Application Graph')} key="application-graph">
            <Loading visible={loading && resourceLoading} style={{ width: '100%' }}>
              <If condition={applicationStatus}>
                <ApplicationGraph
                  applicationStatus={applicationStatus}
                  application={applicationDetail}
                  env={env}
                  resources={resources}
                  components={components}
                  componentsData={componentData}
                  graphType="application-graph"
                />
              </If>
            </Loading>
          </Tab.Item>
        </Tab>
      </div>
    );
  }
}

export default ApplicationStatusPage;
