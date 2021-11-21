import React from 'react';
import { connect } from 'dva';
import { Table } from '@b-design/ui';
import { listApplicationPods } from '../../api/observation';
import { ApplicationDetail, ApplicationStatus, EnvBinding } from '../../interface/application';
import Translation from '../../components/Translation';
import { PodBase } from '../../interface/observation';
import PodDetail from './components/PodDetail';
import Header from './components/Hearder';
import { DeliveryTarget } from '../../interface/deliveryTarget';
import { Link } from 'dva/router';
import { momentDate } from '../../utils/common';

const { Column } = Table;
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
  envbinding: Array<EnvBinding>;
};

type State = {
  podList?: Array<PodBase>;
  envName: string;
  loading: boolean;
  target?: DeliveryTarget;
  openRowKeys: [];
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
        dataIndex: 'podName',
        cell: (v: string, index: number, record: PodBase) => {
          return (
            <div>
              <div>{record.podName}</div>
              <div>{record.podIP}</div>
            </div>
          );
        },
      },
      {
        key: 'clusterName',
        title: <Translation>Delivery Target</Translation>,
        dataIndex: 'clusterName',
        cell: (v: string, index: number, record: PodBase) => {
          const target = getTarget(record.clusterName + '-' + record.podNs);
          return <span>{target?.alias || target?.name}</span>;
        },
      },
      {
        key: 'status',
        title: <Translation>Status</Translation>,
        dataIndex: 'status',
        cell: (v: string) => {
          return <span style={{ color: getColor(v) }}>{v}</span>;
        },
      },
      {
        key: 'createTime',
        title: <Translation>CreateTime</Translation>,
        dataIndex: 'creationTime',
        cell: (v: string) => {
          return <span>{momentDate(v)}</span>;
        },
      },
      {
        key: 'deployVersion',
        title: <Translation>Revision</Translation>,
        dataIndex: 'deployVersion',
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
        dataIndex: 'nodeName',
        cell: (v: string, index: number, record: PodBase) => {
          return (
            <div>
              <div>{record.nodeName}</div>
              <div>{record.hostIP}</div>
            </div>
          );
        },
      },
      {
        key: 'nodeName',
        dataIndex: 'nodeName',
        cell: (v: string, index: number, record: PodBase) => {
          return <span></span>;
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

  onRowOpen = (openRowKeys: any, currentRowKey: string, expanded: boolean, currentRecord: any) => {
    this.setState({ openRowKeys });
  };

  render() {
    const { applicationStatus, applicationDetail } = this.props;
    const { podList, loading } = this.state;
    const columns = this.getCloumns();
    const expandedRowRender = (record: PodBase, index: number) => {
      return (
        <div style={{ margin: '16px 0' }}>
          <PodDetail pod={record} />
        </div>
      );
    };
    const {
      params: { envName },
    } = this.props.match;
    return (
      <div>
        <Header
          targets={this.getTargets()}
          envName={envName}
          loadApplicationEnvbinding={this.loadApplicationEnvbinding}
          applicationDetail={applicationDetail}
          applicationStatus={applicationStatus}
          updateQuery={(targetName: string) => {
            this.updateQuery(targetName);
          }}
          refresh={() => {
            this.loadAppPods();
            this.loadApplicationStatus();
          }}
        />
        <Table
          className="podlist-table-wraper"
          size="medium"
          primaryKey={'podName'}
          loading={loading}
          dataSource={podList}
          expandedIndexSimulate
          expandedRowRender={expandedRowRender}
          openRowKeys={this.state.openRowKeys}
          onRowOpen={(
            openRowKeys: any,
            currentRowKey: string,
            expanded: boolean,
            currentRecord: any,
          ) => {
            this.onRowOpen(openRowKeys, currentRowKey, expanded, currentRecord);
          }}
        >
          {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default ApplicationInstanceList;
