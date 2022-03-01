import React from 'react';
import { connect } from 'dva';

import { Table, Card, Loading, Balloon, Icon, Button, Message, Dialog } from '@b-design/ui';
import type {
  ApplicationDetail,
  ApplicationStatus,
  Condition,
  EnvBinding,
  Resource,
} from '../../interface/application';
import { If } from 'tsx-control-statements/components';
import Translation from '../../components/Translation';
import locale from '../../utils/locale';
import { Link } from 'dva/router';
import Header from '../ApplicationInstanceList/components/Header';
import { listApplicationServiceEndpoints } from '../../api/observation';
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
  applicationDetail?: ApplicationDetail;
  applicationStatus?: ApplicationStatus;
  envbinding: EnvBinding[];
};

type State = {
  loading: boolean;
  endpoints?: Endpoint[];
  target?: Target;
  componentName?: string;
};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationMonitor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    this.loadApplicationStatus();
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
    const { applicationDetail, envbinding, applicationStatus } = this.props;
    const {
      params: { appName, envName },
    } = this.props.match;
    const { target, componentName } = this.state;
    const envs = envbinding.filter((item) => item.name == envName);
    const env = this.getEnvbindingByName();
    if (
      applicationDetail &&
      applicationDetail.name &&
      env &&
      applicationStatus &&
      applicationStatus.services?.length
    ) {
      const param = {
        appName: envs[0].appDeployName || appName,
        appNs: envs[0].appDeployNamespace,
        name: componentName,
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

  updateQuery = (targetName: string) => {
    if (!targetName) {
      this.setState({ target: undefined }, () => {
        this.loadApplicationEndpoints();
      });
      return;
    }
    const targets = this.getTargets()?.filter((item) => item.name == targetName);
    if (targets?.length) {
      this.setState({ target: targets[0] }, () => {
        this.loadApplicationEndpoints();
      });
    }
  };

  onDeploy = (force?: boolean) => {
    const { envbinding } = this.props;
    const {
      params: { appName, envName },
    } = this.props.match;
    const envs = envbinding.filter((item) => item.name == envName);
    if (envs) {
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
    const { applicationStatus, applicationDetail } = this.props;
    const {
      params: { appName, envName },
    } = this.props.match;
    const { loading, endpoints } = this.state;
    const gatewayIPs: any = [];
    endpoints?.map((endpointObj) => {
      const item = getLink(endpointObj);
      gatewayIPs.push(item);
    });
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
          updateEnvs={() => {
            this.loadApplicationEnvbinding();
            this.loadApplicationWorkflows();
          }}
          updateQuery={(targetName: string) => {
            this.updateQuery(targetName);
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
              <Table locale={locale.Table} dataSource={applicationStatus?.appliedResources}>
                <Table.Column
                  dataIndex="name"
                  width="240px"
                  title={<Translation>Namespace/Name</Translation>}
                  cell={(v: string, i: number, row: Resource) => {
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
            <If condition={applicationStatus?.services}>
              <Card
                locale={locale.Card}
                style={{ marginTop: '8px', marginBottom: '16px' }}
                contentHeight="auto"
                title={<Translation>Component Status</Translation>}
              >
                <Table
                  locale={locale.Table}
                  className="customTable"
                  dataSource={applicationStatus?.services}
                >
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
                  <Button onClick={() => this.onDeploy()} type="primary">
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
