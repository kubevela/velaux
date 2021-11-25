import React from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import SelectSearch from './components/ClustSelectSearch';
import CardContend from './components/CardContent/index';
import CloudServiceDialog from './components/CloudServiceDialog/index';
import AddClustDialog from './components/AddClustDialog/index';
import { Button, Message } from '@b-design/ui';
import { deleteCluster } from '../../api/cluster';
import Translation from '../../components/Translation';
import { If } from 'tsx-control-statements/components';

type Props = {
  clusterList: [];
  defaultCluster: string;
  cloudClusters: [];
  dispatch: ({}) => {};
};

type State = {
  page: number;
  pageSize: number;
  query: string;
  showAddCluster: boolean;
  showAddCloudCluster: boolean;
  editClusterName: string;
};

@connect((store: any) => {
  return { ...store.clusters };
})
class Cluster extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      page: 0,
      pageSize: 10,
      showAddCluster: false,
      showAddCloudCluster: false,
      editClusterName: '',
    };
  }

  componentDidMount() {
    this.getClusterList();
  }

  getClusterList = async () => {
    const { page, pageSize, query } = this.state;
    this.props.dispatch({
      type: 'clusters/getClusterList',
      payload: {
        query,
        page,
        pageSize,
      },
    });
  };

  getChildCompentQuery = (query: string) => {
    this.setState(
      {
        query,
      },
      () => {
        this.getClusterList();
      },
    );
  };

  onDeleteCluster = (name: string) => {
    deleteCluster({ clusterName: name }).then((re) => {
      if (re) {
        Message.success('cluster delete success');
        this.getClusterList();
      }
    });
  };

  render() {
    const { clusterList = [], dispatch } = this.props;
    const { page, pageSize, query, showAddCluster, showAddCloudCluster, editClusterName } =
      this.state;
    return (
      <div>
        <Title
          title="Cluster management"
          subTitle="Introduction to cluster management"
          addButtonTitle="Cluster Join"
          addButtonClick={() => {
            this.setState({ showAddCluster: true });
          }}
          extButtons={[
            <Button
              type="secondary"
              style={{ marginRight: '16px' }}
              onClick={() => {
                this.setState({ showAddCloudCluster: true });
              }}
            >
              <Translation>Add from cloud service</Translation>
            </Button>,
          ]}
        />
        <SelectSearch
          dispatch={dispatch}
          getChildCompentQuery={(q: string): any => {
            this.getChildCompentQuery(q);
          }}
        />
        <CardContend
          editCluster={(name: string) => {
            this.setState({ showAddCluster: true, editClusterName: name });
          }}
          deleteCluster={this.onDeleteCluster}
          clusters={clusterList}
        />
        <div>
          <If condition={showAddCloudCluster}>
            <CloudServiceDialog
              visible={showAddCloudCluster}
              setVisible={(visible) => {
                this.getClusterList();
                this.setState({ showAddCloudCluster: visible });
              }}
              setCloudService={(visible) => {
                this.setState({ showAddCloudCluster: visible });
              }}
              dispatch={dispatch}
            />
          </If>
          <If condition={showAddCluster}>
            <AddClustDialog
              page={page}
              pageSize={pageSize}
              query={query}
              visible={showAddCluster}
              editClusterName={editClusterName}
              onClose={() => {
                this.getClusterList();
                this.setState({ showAddCluster: false, editClusterName: '' });
              }}
              onOK={() => {
                this.getClusterList();
                this.setState({ showAddCluster: false, editClusterName: '' });
              }}
              dispatch={dispatch}
            />
          </If>
        </div>
      </div>
    );
  }
}

export default Cluster;
