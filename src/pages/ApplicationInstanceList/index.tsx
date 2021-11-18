import React from 'react';
import { connect } from 'dva';
import { Table, Button, Message } from '@b-design/ui';
import { listApplicationPods, listApplicationPodsDetails, } from '../../api/observation';
import { ApplicationDetail, EnvBinding, } from '../../interface/application';
import Translation from '../../components/Translation';
import { PodBase, Container, Event } from '../../interface/observation';
import PodDetail from './components/PodDetail';
import Header from './components/Hearder';
const { Column } = Table;



type Props = {
  dispatch: ({ }) => {};
  match: {
    params: {
      envName: string;
    };
  };
  applicationDetail?: ApplicationDetail;
};

type State = {
  podList?: Array<PodBase>;
  envName: string;
  loading: boolean;
  cluster: string;
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
      cluster: this.getInitCluster(params.envName),
    };
  }

  componentDidMount() {
    this.loadAppPods();
  }

  componentWillReceiveProps(nextProps: any) {
    const { params } = nextProps.match;
    if (params.envName !== this.state.envName) {
      const cluster = this.getInitCluster(params.envName);
      this.setState({ envName: params.envName, cluster: cluster }, () => {
        this.loadAppPods();
      })
    }
  }


  getInitCluster(envName: string) {
    const { applicationDetail = { envBinding: [] } } = this.props;
    const envBinding: Array<EnvBinding> = applicationDetail.envBinding;
    if (Array.isArray(envBinding) && envBinding.length !== 0) {
      const find = envBinding.find(item => item.name === envName);
      return find && find.targetNames && find.targetNames[0] || '';
    }
    return ''
  }

  loadAppPods = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail && applicationDetail.name) {
      this.setState({ loading: true });
      listApplicationPods({
        appName: applicationDetail.name,
        namespace: applicationDetail.namespace,
        componentName: applicationDetail.name,
        cluster: this.state.cluster || "",
      })
        .then((re) => {
          if (re && re.error) {
            Message.warning(re.error);
          } else if (re && re.podList) {
            this.setState({ podList: re.podList });
          }
        })
        .finally(() => {
          this.setState({ loading: false });
        });
    }
  };
  getCloumns = () => {
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
          return <span>{v}</span>;
        },
      },
      {
        key: 'publishVersion',
        title: <Translation>Revision</Translation>,
        dataIndex: 'publishVersion',
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

  updateQuery = (cluster: string) => {
    this.setState({ cluster }, () => {
      this.loadAppPods();
    })
  }


  getTargetName = () => {
    const { envName } = this.state;
    const { applicationDetail } = this.props;
    const { envBinding } = applicationDetail || {};
    if (Array.isArray(envBinding) && envBinding.length !== 0) {
      const find = envBinding.find(item => item.name === envName);
      return find && find.targetNames || []
    } else {
      return []
    }
  }

  onRowOpen = (openRowKeys: any, currentRowKey: string, expanded: boolean, currentRecord: any) => {
    if (expanded && currentRecord) {
      const { podName, clusterName } = currentRecord;
      const namespace = this.props.applicationDetail && this.props.applicationDetail.namespace;
      listApplicationPodsDetails({
        name: podName || '',
        namespace: namespace || '',
        cluster: clusterName || '',
      }).then((re) => {
        if (re && re.error) {
          Message.warning(re.error);
        } else if (re) {
          this.setState({
            containers: re.containers,
            events: re.events
          });
        }
      })
        .finally(() => {
          this.setState({ loading: false });
        });
    }
  }

  render() {
    const { podList, loading, cluster, containers = [], events = [] } = this.state;
    const columns = this.getCloumns();
    const expandedRowRender = (record: PodBase, index: number) => {
      return <div>
        <PodDetail pod={record} podContainer={containers} podEvent={events} />
      </div>
    };

    return (
      <div>
        <Header
          cluster={cluster}
          targetNames={this.getTargetName()}
          updateQuery={(cluster: string) => { this.updateQuery(cluster) }}
        />
        <Table
          className='podlist-table-wraper'
          size="medium"
          loading={loading}
          dataSource={podList}
          expandedRowRender={expandedRowRender}
          onRowOpen={(openRowKeys: any, currentRowKey: string, expanded: boolean, currentRecord: any) => { this.onRowOpen(openRowKeys, currentRowKey, expanded, currentRecord) }}
        >
          {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default ApplicationInstanceList;
