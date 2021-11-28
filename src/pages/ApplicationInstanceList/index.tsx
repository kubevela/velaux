import React from 'react';
import { connect } from 'dva';
import { Table, Button, Message, Dialog } from '@b-design/ui';
import { listApplicationPods } from '../../api/observation';
import { deployApplication } from '../../api/application';
import type { ApplicationDetail, ApplicationStatus, EnvBinding } from '../../interface/application';
import Translation from '../../components/Translation';
import type { PodBase } from '../../interface/observation';
import PodDetail from './components/PodDetail';
import Header from './components/Hearder';
import type { DeliveryTarget } from '../../interface/deliveryTarget';
import { Link } from 'dva/router';
import { momentDate } from '../../utils/common';
import { If } from 'tsx-control-statements/components';
import type { APIError } from '../../utils/errors';
import { handleError } from '../../utils/errors';
import StatusShow from './components/StatusShow';

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
};

type State = {
  podList?: PodBase[];
  envName: string;
  loading: boolean;
  target?: DeliveryTarget;
  openRowKeys: [];
  showStatus: boolean;
};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationInstanceList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { params } = props.match;
    this.state = {
      envName: params.envName,
      loading: true,
      openRowKeys: [],
      showStatus: false,
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
          this.setState({ podList: [] });
          this.loadAppPods();
        },
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

  loadAppPods = async () => {
    const { applicationDetail, envbinding, applicationStatus } = this.props;
    const {
      params: { appName, envName },
    } = this.props.match;
    const { target } = this.state;
    const envs = envbinding.filter((item) => item.name == envName);
    if (
      applicationDetail &&
      applicationDetail.name &&
      envs.length > 0 &&
      applicationStatus &&
      applicationStatus.services?.length
    ) {
      const conponentName = applicationStatus.services[0].name;
      this.setState({ loading: true });
      const param = {
        appName: envs[0].appDeployName || appName + '-' + envName,
        appNs: applicationDetail.namespace,
        name: conponentName,
        cluster: '',
        clusterNs: '',
      };
      if (target) {
        param.cluster = target.cluster?.clusterName || '';
        param.clusterNs = target.cluster?.namespace || '';
      }
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
    } else {
      this.setState({ loading: false });
    }
  };
  getCloumns = () => {
    const { applicationDetail } = this.props;
    const getColor = (status: string) => {
      switch (status) {
        case 'Running':
          return '#28a745';
      }
    };
    const targets = this.getTargets();
    const targetMap = new Map<string, DeliveryTarget>();
    targets?.map((item) => {
      targetMap.set(item.cluster?.clusterName + '-' + item.cluster?.namespace, item);
    });
    const getTarget = (key: string) => {
      return targetMap.get(key);
    };
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

  updateQuery = (targetName: string) => {
    if (!targetName) {
      this.setState({ target: undefined }, () => {
        this.loadAppPods();
      });
      return;
    }
    const targets = this.getTargets()?.filter((item) => item.name == targetName);
    if (targets?.length) {
      this.setState({ target: targets[0] }, () => {
        this.loadAppPods();
      });
    }
  };

  getTargets = () => {
    const { envbinding, match } = this.props;
    const env = envbinding.filter((item) => item.name == match.params.envName);
    if (env.length > 0) {
      return env[0].deliveryTargets;
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
            Message.success('deploy application success');
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
            });
          } else {
            handleError(err);
          }
        });
    } else {
      Message.warning('Please wait');
    }
  };
  render() {
    const { applicationStatus, applicationDetail } = this.props;
    const { podList, loading, showStatus } = this.state;
    const columns = this.getCloumns();
    const expandedRowRender = (record: PodBase) => {
      return (
        <div style={{ margin: '16px 0' }}>
          <PodDetail pod={record} />
        </div>
      );
    };
    const {
      params: { envName, appName },
    } = this.props.match;
    return (
      <div>
        <Header
          targets={this.getTargets()}
          envName={envName}
          updateEnvs={() => {
            this.loadApplicationEnvbinding();
            this.loadApplicationWorkflows();
          }}
          updateStatusShow={(show: boolean) => {
            this.setState({ showStatus: show });
          }}
          applicationDetail={applicationDetail}
          applicationStatus={applicationStatus}
          updateQuery={(targetName: string) => {
            this.updateQuery(targetName);
          }}
          refresh={() => {
            this.loadApplicationStatus();
          }}
        />
        <If condition={applicationStatus}>
          <Table
            className="podlist-table-wraper"
            size="medium"
            primaryKey={'primaryKey'}
            loading={loading}
            dataSource={podList}
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
                  <Translation>Immediately Deploy</Translation>
                </Button>
              </div>
            </div>
          </div>
        </If>
        <If condition={showStatus}>
          <StatusShow
            envName={envName}
            appName={appName}
            dispatch={this.props.dispatch}
            onClose={() => {
              this.setState({ showStatus: false });
            }}
          />
        </If>
      </div>
    );
  }
}

export default ApplicationInstanceList;
