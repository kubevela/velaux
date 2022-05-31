import React from 'react';
import { connect } from 'dva';
import { Table, Button, Message, Dialog, Card } from '@b-design/ui';
import {
  listApplicationPods,
  listCloudResources,
  listApplicationServiceEndpoints,
} from '../../api/observation';
import { deployApplication } from '../../api/application';
import type {
  ApplicationComponent,
  ApplicationDetail,
  ApplicationStatus,
  EnvBinding,
} from '../../interface/application';
import Translation from '../../components/Translation';
import type { PodBase, CloudResource, Configuration, Endpoint } from '../../interface/observation';
import PodDetail from './components/PodDetail';
import Header from './components/Header';
import type { Target } from '../../interface/target';
import { Link } from 'dva/router';
import { momentDate } from '../../utils/common';
import { If } from 'tsx-control-statements/components';
import type { APIError } from '../../utils/errors';
import { handleError } from '../../utils/errors';
import StatusShow from '../../components/StatusShow';
import locale from '../../utils/locale';
import { getLink } from '../../utils/utils';
import i18n from '../../i18n';
import querystring from 'query-string';
import type { LoginUserInfo } from '../../interface/user';

const { Column } = Table;
type Props = {
  dispatch: ({}) => void;
  match: {
    params: {
      envName: string;
      appName: string;
    };
  };
  applicationDetail?: ApplicationDetail;
  applicationStatus?: ApplicationStatus;
  envbinding: EnvBinding[];
  components?: ApplicationComponent[];
  userInfo?: LoginUserInfo;
};

type State = {
  podList?: PodBase[];
  cloudResourceList?: CloudResource[];
  envName: string;
  loading: boolean;
  target?: Target;
  componentName?: string;
  openRowKeys: [];
  cloudInstance?: CloudInstance[];
  showStatus: boolean;
  endpoints?: Endpoint[];
  deployLoading: boolean;
};

type CloudInstance = {
  instanceName: string;
  status: string;
  region: string;
  createTime: string;
  message?: string;
  url?: string;
  type?: string;
};

@connect((store: any) => {
  return { ...store.application, ...store.user };
})
class ApplicationInstanceList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { params } = props.match;
    this.state = {
      envName: params.envName,
      loading: false,
      openRowKeys: [],
      showStatus: false,
      deployLoading: false,
    };
  }

  componentDidMount() {
    this.loadApplicationStatus();

    const query = querystring.parse(location.search);
    if (query && query.pod) {
      this.onRowOpen([query.pod as string]);
    }
  }

  componentWillReceiveProps(nextProps: any) {
    const { params } = nextProps.match;
    if (params.envName !== this.state.envName) {
      this.setState({ envName: params.envName }, () => {
        this.loadApplicationStatus();
      });
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
        callback: (re: any) => {
          this.loadAppInstances();
          if (re) {
            const status: ApplicationStatus = re.status;
            if (status && status.appliedResources) {
              this.loadApplicationEndpoints();
            }
          }
        },
      });
    }
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
      this.setState({ loading: true });
      listApplicationServiceEndpoints(param)
        .then((re) => {
          if (re && re.endpoints) {
            this.setState({ endpoints: re.endpoints });
          } else {
            this.setState({ endpoints: [] });
          }
        })
        .finally(() => {
          this.setState({ loading: false });
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

  convertCloudInstance = (configurations: Configuration[]) => {
    const instances: CloudInstance[] = [];
    if (Array.isArray(configurations) && configurations.length > 0) {
      configurations.map((configuration) => {
        let url = configuration.metadata.annotations['cloud-resource/console-url'];
        const identifierKey = configuration.metadata.annotations['cloud-resource/identifier'];
        const outputs = configuration.status?.apply?.outputs;
        let instanceName = '';
        if (outputs) {
          if (outputs[identifierKey]) {
            instanceName = outputs[identifierKey].value;
          }
          if (url) {
            const params = url.match(/\{(.+?)\}/g);
            if (Array.isArray(params) && params.length > 0) {
              params.map((param) => {
                const paramKey = param.replace('{', '').replace('}', '');
                if (paramKey.toLowerCase() == 'region' && configuration.spec.region) {
                  url = url.replace(param, configuration.spec.region);
                }
                if (outputs[paramKey]) {
                  url = url.replace(param, outputs[paramKey].value);
                }
              });
            }
          }
        }
        instances.push({
          instanceName: instanceName,
          status: configuration.status?.apply?.state || 'Initing',
          url: url,
          createTime: configuration.metadata.creationTimestamp,
          region: configuration.spec.region,
          message: configuration.status?.apply?.message,
          type: configuration.metadata.labels['workload.oam.dev/type'],
        });
      });
    }
    this.setState({ cloudInstance: instances });
  };

  loadAppInstances = async () => {
    this.setState({ podList: [] });
    const { applicationDetail, envbinding, components } = this.props;
    const {
      params: { appName, envName },
    } = this.props.match;
    const cloudComponents = components?.filter(
      (c) => c.workloadType?.type == 'configurations.terraform.core.oam.dev',
    );
    const showCloudInstance = cloudComponents?.length && cloudComponents?.length > 0;
    const { target, componentName } = this.state;
    const envs = envbinding.filter((item) => item.name == envName);
    if (applicationDetail && applicationDetail.name && envs.length > 0) {
      const param = {
        appName: envs[0].appDeployName || appName,
        appNs: envs[0].appDeployNamespace,
        componentName: componentName,
        cluster: '',
        clusterNs: '',
      };
      if (target) {
        param.cluster = target.cluster?.clusterName || '';
        param.clusterNs = target.cluster?.namespace || '';
      }
      this.setState({ loading: true });
      listApplicationPods(param)
        .then((re) => {
          if (re && re.podList) {
            re.podList.map((item: any) => {
              item.primaryKey = item.metadata.name;
            });
            this.setState({ podList: re.podList });
          } else {
            this.setState({ podList: [] });
          }
        })
        .finally(() => {
          this.setState({ loading: false });
        });
      if (showCloudInstance) {
        this.setState({ loading: true });
        listCloudResources(param)
          .then((cloudResources: any) => {
            if (cloudResources) {
              this.convertCloudInstance(cloudResources['cloud-resources']);
            }
          })
          .finally(() => {
            this.setState({ loading: false });
          });
      } else {
        this.setState({ loading: false });
      }
    } else {
      setTimeout(() => {
        this.loadAppInstances();
      }, 1000);
    }
  };
  getColumns = () => {
    const { applicationDetail, components } = this.props;
    const getColor = (status: string) => {
      switch (status) {
        case 'Running':
          return '#28a745';
      }
    };
    const targets = this.getTargets();
    const targetMap = new Map<string, Target>();
    targets?.map((item) => {
      targetMap.set(item.cluster?.clusterName + '-' + item.cluster?.namespace, item);
    });
    const getTarget = (key: string) => {
      return targetMap.get(key);
    };
    const componentNameAlias: any = {};
    components?.map((c) => {
      componentNameAlias[c.name] = c.alias || c.name;
    });
    return [
      {
        key: 'podName',
        title: <Translation>Pod Name</Translation>,
        dataIndex: 'metadata.name',
        cell: (v: string, index: number, record: PodBase) => {
          return (
            <div>
              <div>{record.metadata.name}</div>
              <div>{record.status.podIP}</div>
            </div>
          );
        },
      },
      {
        key: 'clusterName',
        title: <Translation>Target</Translation>,
        dataIndex: 'cluster',
        cell: (v: string, index: number, record: PodBase) => {
          const target = getTarget(record.cluster + '-' + record.metadata.namespace);
          if (target) {
            return <span>{target?.alias || target?.name}</span>;
          }
          return (
            <span>
              {record.cluster}/{record.metadata.namespace}
            </span>
          );
        },
      },
      {
        key: 'component',
        title: <Translation>Component</Translation>,
        dataIndex: 'component',
        cell: (v: string) => {
          return componentNameAlias[v];
        },
      },
      {
        key: 'status',
        title: <Translation>Status</Translation>,
        dataIndex: 'status.phase',
        cell: (v: string) => {
          return <span style={{ color: getColor(v) }}>{v}</span>;
        },
      },
      {
        key: 'createTime',
        title: <Translation>CreateTime</Translation>,
        dataIndex: 'metadata.creationTime',
        cell: (v: string) => {
          return <span>{momentDate(v)}</span>;
        },
      },
      {
        key: 'deployVersion',
        title: <Translation>Revision</Translation>,
        dataIndex: 'metadata.version.deployVersion',
        cell: (v: string) => {
          return (
            <span>
              <Link to={`/applications/${applicationDetail?.name}/revisions`}>{v}</Link>
            </span>
          );
        },
      },
      {
        key: 'workload',
        title: <Translation>Workload Type</Translation>,
        dataIndex: 'workload.kind',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'nodeName',
        title: <Translation>Node</Translation>,
        dataIndex: 'status.nodeName',
        cell: (v: string, index: number, record: PodBase) => {
          return (
            <div>
              <div>{record.status.nodeName}</div>
              <div>{record.status.hostIP}</div>
            </div>
          );
        },
      },
    ];
  };

  updateQuery = (params: { target?: string; component?: string }) => {
    const targets = this.getTargets()?.filter((item) => item.name == params.target);
    let target = undefined;
    if (targets && targets.length > 0) {
      target = targets[0];
    }
    this.setState({ target: target, componentName: params.component }, () => {
      this.loadAppInstances();
      this.loadApplicationEndpoints();
    });
  };

  getTargets = () => {
    const { envbinding, match } = this.props;
    const env = envbinding.filter((item) => item.name == match.params.envName);
    if (env.length > 0) {
      return env[0].targets;
    }
    return [];
  };

  onRowOpen = (openRowKeys: any) => {
    this.setState({ openRowKeys });
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
            Message.success(i18n.t('Application deployed successfully'));
            this.setState({ deployLoading: false });
            this.loadApplicationStatus();
          }
        })
        .catch((err: APIError) => {
          if (err.BusinessCode === 10004) {
            Dialog.confirm({
              content: 'Workflow is executing. Do you want to force a restart?',
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
      Message.warning('Please wait');
    }
  };
  getEnvbindingByName = () => {
    const { envbinding } = this.props;
    const {
      params: { envName },
    } = this.props.match;
    return envbinding.find((env) => env.name === envName);
  };

  loadStatusDetail = async () => {
    const {
      params: { appName, envName },
    } = this.props.match;
    if (envName) {
      this.setState({ loading: true });
      this.props.dispatch({
        type: 'application/getApplicationStatus',
        payload: { appName: appName, envName: envName },
        callback: () => {
          this.setState({ loading: false });
        },
      });
    }
  };

  onStatusClose = () => {
    this.setState({ showStatus: false });
  };

  render() {
    const { applicationStatus, applicationDetail, components, userInfo } = this.props;
    const { podList, loading, showStatus, cloudInstance, endpoints, deployLoading } = this.state;
    const columns = this.getColumns();
    const envbinding = this.getEnvbindingByName();
    const expandedRowRender = (record: PodBase) => {
      return (
        <div style={{ margin: '16px 0' }}>
          <PodDetail
            env={envbinding}
            userInfo={userInfo}
            clusterName={record.cluster}
            application={applicationDetail}
            pod={record}
          />
        </div>
      );
    };
    const gatewayIPs: any = [];
    endpoints?.map((endpointObj) => {
      const item = getLink(endpointObj);
      gatewayIPs.push(item);
    });
    const {
      params: { envName, appName },
    } = this.props.match;

    const cloudComponents = components?.filter(
      (c) => c.workloadType?.type == 'configurations.terraform.core.oam.dev',
    );
    const showCloudInstance = cloudComponents?.length && cloudComponents?.length > 0;

    const onlyShowCloudInstance =
      showCloudInstance && cloudComponents?.length == components?.length;
    return (
      <div>
        <Header
          envbinding={envbinding}
          targets={this.getTargets()}
          components={components}
          envName={envName}
          appName={appName}
          gatewayIPs={gatewayIPs}
          updateEnvs={() => {
            this.loadApplicationEnvbinding();
            this.loadApplicationWorkflows();
          }}
          applicationDetail={applicationDetail}
          applicationStatus={applicationStatus}
          updateQuery={(params: { target?: string; component?: string }) => {
            this.updateQuery(params);
          }}
          refresh={() => {
            this.loadApplicationStatus();
          }}
          dispatch={this.props.dispatch}
        />
        <If condition={applicationStatus}>
          <If condition={!onlyShowCloudInstance}>
            <Table
              style={{ marginBottom: '32px' }}
              locale={locale().Table}
              className="podlist-table-wrapper"
              size="medium"
              primaryKey={'primaryKey'}
              loading={loading}
              dataSource={podList || []}
              expandedIndexSimulate
              expandedRowRender={expandedRowRender}
              openRowKeys={this.state.openRowKeys}
              onRowOpen={(openRowKeys: any) => {
                this.onRowOpen(openRowKeys);
              }}
            >
              {columns && columns.map((col) => <Column {...col} key={col.key} align={'left'} />)}
            </Table>
          </If>
          <If condition={showCloudInstance}>
            <Card title={i18n.t('Instances of the cloud service')}>
              <Table
                size="medium"
                locale={locale().Table}
                className="customTable"
                dataSource={cloudInstance}
                primaryKey={'instanceName'}
                loading={loading}
              >
                <Column
                  align="left"
                  title={<Translation>Name</Translation>}
                  dataIndex="instanceName"
                  cell={(value: string, index: number, record: CloudInstance) => {
                    if (record.url) {
                      return (
                        <a target="_blank" href={record.url}>
                          {value}
                        </a>
                      );
                    }
                    return value;
                  }}
                />
                <Column align="left" title={<Translation>Status</Translation>} dataIndex="status" />
                <Column
                  align="left"
                  title={<Translation>Resource Type</Translation>}
                  dataIndex="type"
                />
                <Column
                  align="left"
                  title={<Translation>Create Time</Translation>}
                  dataIndex="createTime"
                  cell={(v: string) => {
                    return <span>{momentDate(v)}</span>;
                  }}
                />
                <Column align="left" title={<Translation>Region</Translation>} dataIndex="region" />
                <Column
                  align="left"
                  title={<Translation>Actions</Translation>}
                  dataIndex="url"
                  cell={(value: string, index: number, record: CloudInstance) => {
                    if (record.instanceName) {
                      return (
                        <a target="_blank" href={value}>
                          <Translation>Console</Translation>
                        </a>
                      );
                    }
                  }}
                />
              </Table>
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
        <If condition={showStatus}>
          <StatusShow
            loading={loading}
            title={<Translation>Application Status</Translation>}
            applicationStatus={applicationStatus}
            loadStatusDetail={this.loadStatusDetail}
            onClose={this.onStatusClose}
          />
        </If>
      </div>
    );
  }
}

export default ApplicationInstanceList;
