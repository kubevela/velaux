import React from 'react';
import { connect } from 'dva';
import { Table, Button, Message } from '@b-design/ui';
import { listApplicationPods, listApplicationPodsDetails } from '../../api/observation';
import { ApplicationDetail, ApplicationStatus, EnvBinding } from '../../interface/application';
import Translation from '../../components/Translation';
import { PodBase, Container, Event } from '../../interface/observation';
import PodDetail from './components/PodDetail';
import Header from './components/Hearder';
import { DeliveryTarget } from '../../interface/deliveryTarget';
import { Link } from 'dva/router';
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
  containers?: Array<Container>;
  events?: Array<Event>;
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
        namespace: applicationDetail.namespace,
        componentName: conponentName,
        cluster: '',
      };
      if (target) {
        param.cluster = target.cluster?.clusterName || '';
      }
      listApplicationPods(param)
        .then((re) => {
          if (re && re.podList) {
            this.setState({ podList: re.podList });
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
        key: 'status',
        title: <Translation>Status</Translation>,
        dataIndex: 'status',
        cell: (v: string) => {
          return <span style={{ color: getColor(v) }}>{v}</span>;
        },
      },
      {
        key: 'publishVersion',
        title: <Translation>Revision</Translation>,
        dataIndex: 'publishVersion',
        cell: (v: string) => {
          return (
            <span>
              <Link to={`/applications/${applicationDetail?.name}/revisions`}>{v}</Link>
            </span>
          );
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
    if (expanded && currentRecord) {
      const { podName, clusterName, namespace } = currentRecord;
      listApplicationPodsDetails({
        name: podName || '',
        namespace: namespace || '',
        cluster: clusterName || '',
      })
        .then((re) => {
          if (re && re.error) {
            Message.warning(re.error);
          } else if (re) {
            this.setState({
              containers: re.containers,
              events: re.events,
            });
          }
        })
        .finally(() => {
          this.setState({ loading: false });
        });
    }
  };

  render() {
    const { applicationStatus, applicationDetail } = this.props;
    const { podList, loading, containers = [], events = [] } = this.state;
    const columns = this.getCloumns();
    const expandedRowRender = (record: PodBase, index: number) => {
      return (
        <div>
          <PodDetail pod={record} podContainer={containers} podEvent={events} />
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
        />
        <Table
          className="podlist-table-wraper"
          size="medium"
          loading={loading}
          dataSource={podList}
          expandedRowRender={expandedRowRender}
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
