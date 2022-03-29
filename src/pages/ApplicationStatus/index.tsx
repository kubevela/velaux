import React from 'react';
import { connect } from 'dva';

import { Table, Card, Loading, Balloon, Icon, Button, Message, Dialog } from '@b-design/ui';
import type {
  ApplicationComponent,
  ApplicationDetail,
  ApplicationStatus,
  Condition,
  EnvBinding,
  AppliedResource,
} from '../../interface/application';
import { If } from 'tsx-control-statements/components';
import Translation from '../../components/Translation';
import locale from '../../utils/locale';
import { Link } from 'dva/router';
import Header from '../ApplicationInstanceList/components/Header';
import {
  listApplicationServiceAppliedResources,
  listApplicationServiceEndpoints,
} from '../../api/observation';
import type { Endpoint } from '../../interface/observation';
import type { Target } from '../../interface/target';
import { getLink } from '../../utils/utils';
import { deployApplication } from '../../api/application';
import type { APIError } from '../../utils/errors';
import { handleError } from '../../utils/errors';
import i18next from 'i18next';

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
};

type State = {
  loading: boolean;
  endpoints?: Endpoint[];
  target?: Target;
  componentName?: string;
  resources?: AppliedResource[];
  deployLoading: boolean;
  envName: string;
};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationMonitor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
      deployLoading: false,
      envName: '',
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
        callback: () => {
          this.setState({ loading: false });
          this.loadApplicationEndpoints();
          this.loadApplicationAppliedResources();
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

  loadApplicationAppliedResources = async () => {
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
      listApplicationServiceAppliedResources(param)
        .then((re) => {
          if (re && re.resources) {
            this.setState({ resources: re.resources });
          } else {
            this.setState({ resources: [] });
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
            Message.success(i18next.t('deploy application success'));
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
              locale: locale.Dialog,
            });
          } else {
            handleError(err);
          }
        });
    } else {
      Message.warning(i18next.t('Please wait'));
    }
  };

  render() {
    const { applicationStatus, applicationDetail, components } = this.props;
    const {
      params: { appName, envName },
    } = this.props.match;
    const { loading, endpoints, resources, componentName, deployLoading } = this.state;
    const gatewayIPs: any = [];
    endpoints?.map((endpointObj) => {
      const item = getLink(endpointObj);
      gatewayIPs.push(item);
    });
    let componentStatus = applicationStatus?.services;
    if (componentName) {
      componentStatus = componentStatus?.filter((item) => item.name == componentName);
    }
    return (
      <div>
        <Header
          envbinding={this.getEnvbindingByName()}
          targets={this.getTargets()}
          envName={envName}
          appName={appName}
          disableStatusShow={true}
          gatewayIPs={gatewayIPs}
          applicationDetail={applicationDetail}
          applicationStatus={applicationStatus}
          components={components}
          updateEnvs={() => {
            this.loadApplicationEnvbinding();
            this.loadApplicationWorkflows();
          }}
          updateQuery={(params: { target?: string; component?: string }) => {
            this.updateQuery(params);
          }}
          refresh={() => {
            this.loadApplicationStatus();
          }}
          dispatch={this.props.dispatch}
        />
        <Loading visible={loading} style={{ width: '100%' }}>
          <If condition={applicationStatus}>
            <Card
              locale={locale.Card}
              contentHeight="200px"
              title={<Translation>Applied Resources</Translation>}
            >
              <Table locale={locale.Table} dataSource={resources}>
                <Table.Column
                  dataIndex="name"
                  width="240px"
                  title={<Translation>Namespace/Name</Translation>}
                  cell={(v: string, i: number, row: AppliedResource) => {
                    return `${row.namespace}/${row.name}`;
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
                <Table.Column dataIndex="component" title={<Translation>Component</Translation>} />
                <Table.Column
                  dataIndex="cluster"
                  title={<Translation>Cluster</Translation>}
                  width="200px"
                  cell={(v: string) => {
                    if (!v) {
                      return <Link to="/clusters">Local</Link>;
                    }
                    return <Link to="/clusters">{v}</Link>;
                  }}
                />
              </Table>
            </Card>
            <If condition={componentStatus}>
              <Card
                locale={locale.Card}
                style={{ marginTop: '8px', marginBottom: '16px' }}
                contentHeight="auto"
                title={<Translation>Component Status</Translation>}
              >
                <Table locale={locale.Table} className="customTable" dataSource={componentStatus}>
                  <Table.Column
                    align="left"
                    dataIndex="name"
                    width="200px"
                    title={<Translation>Name</Translation>}
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
                    align="center"
                    dataIndex="message"
                    title={<Translation>Message</Translation>}
                  />
                </Table>
              </Card>
            </If>
            <If condition={applicationStatus?.conditions}>
              <Card
                locale={locale.Card}
                style={{ marginTop: '8px' }}
                contentHeight="auto"
                title={<Translation>Conditions</Translation>}
              >
                <Table locale={locale.Table} dataSource={applicationStatus?.conditions}>
                  <Table.Column
                    width="150px"
                    dataIndex="type"
                    title={<Translation>Type</Translation>}
                  />
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
      </div>
    );
  }
}

export default ApplicationMonitor;
