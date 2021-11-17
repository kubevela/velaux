import React from 'react';
import { connect } from 'dva';
import { Table } from '@b-design/ui';
import { listApplicationPods } from '../../api/observation';
import { ApplicationDetail } from '../../interface/application';
import Translation from '../../components/Translation';
import { PodBase } from '../../interface/observation';
import PodDetail from './components/PodDetail';
const { Column } = Table;

type Props = {
  dispatch: ({}) => {};
  match: any;
  applicationDetail?: ApplicationDetail;
};

type State = {
  podList?: Array<PodBase>;
  loading: boolean;
};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationInstanceList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    this.loadAppPods();
  }

  loadAppPods = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      this.setState({ loading: true });
      listApplicationPods({
        appName: applicationDetail.name,
        namespace: applicationDetail.namespace,
        componentName: applicationDetail.name,
      })
        .then((re) => {
          if (re && re.podList) {
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
        key: 'revision',
        title: <Translation>Revision</Translation>,
        dataIndex: 'revision',
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
  render() {
    const { podList, loading } = this.state;
    const columns = this.getCloumns();
    const expandedRowRender = (record: PodBase, index: number) => {
      return <PodDetail pod={record} />;
    };
    return (
      <Table
        size="medium"
        loading={loading}
        dataSource={podList}
        expandedRowRender={expandedRowRender}
      >
        {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
      </Table>
    );
  }
}

export default ApplicationInstanceList;
