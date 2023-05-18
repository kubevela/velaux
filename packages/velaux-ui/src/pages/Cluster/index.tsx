import { Button, Message } from '@alifd/next';
import { connect } from 'dva';
import React, { Fragment } from 'react';

import { getEnabledAddons, getAddonsList } from '../../api/addons';

import { deleteCluster } from '../../api/cluster';
import { If } from '../../components/If';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { Addon } from '@velaux/data';

import AddClusterDialog from './components/AddClusterDialog/index';
import CardContend from './components/CardContent/index';
import CloudServiceDialog from './components/CloudServiceDialog/index';
import SelectSearch from './components/ClusterSelectSearch';

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
  addonMessage: Array<{ name: string; path: string }>;
  isShowAddonMessage: boolean;
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
      addonMessage: [],
      isShowAddonMessage: false,
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

  query = (query: string) => {
    this.setState(
      {
        query,
      },
      () => {
        this.getClusterList();
      }
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

  onGetEnabledAddon = async () => {
    getEnabledAddons({}).then((res) => {
      this.onGetAddonsList(res.enabledAddons);
    });
  };

  onGetAddonsList = async (enableAddon: { name: string; phase: boolean }[]) => {
    getAddonsList({}).then((res) => {
      const addonMessage: { name: string; path: string }[] = [];
      const addonList: Addon[] = res.addons;
      (enableAddon || []).forEach((ele: { name: string; phase: boolean }) => {
        addonList.forEach((item: Addon) => {
          const isMatchName = ele.name === item.name;
          const deploy = item.deployTo || { runtimeCluster: false, runtime_cluster: false };
          if (isMatchName && deploy.runtimeCluster) {
            addonMessage.push({ name: item.name, path: item.url || '' });
          }
        });
      });
      if (addonMessage && addonMessage.length !== 0) {
        this.setState({
          isShowAddonMessage: true,
          addonMessage: addonMessage,
        });
      }
    });
  };

  showAddonMessage() {
    const { addonMessage } = this.state;
    return (addonMessage || []).map((item, index, arr) => {
      const lastIndex = arr.length - 1;
      const showSymbol = index === lastIndex ? '' : '、';
      return (
        <span>
          <a href={item.path}>
            {item.name}
            {showSymbol}
          </a>
        </span>
      );
    });
  }

  handleHiddenAddonMessage = () => {
    this.setState({ isShowAddonMessage: false });
  };

  render() {
    const { clusterList = [], dispatch } = this.props;
    const {
      page,
      pageSize,
      query,
      showAddCluster,
      showAddCloudCluster,
      editClusterName,
      isShowAddonMessage,
      addonMessage,
    } = this.state;
    return (
      <div>
        <ListTitle
          title="Clusters"
          subTitle="Setup Kubernetes clusters by adding an existing one or creating a new one via cloud provider"
          extButtons={[
            <Fragment>
              <Permission request={{ resource: 'cluster:*', action: 'create' }} project={''}>
                <Button
                  type="secondary"
                  style={{ marginRight: '16px' }}
                  onClick={() => {
                    this.setState({ showAddCloudCluster: true });
                  }}
                >
                  <Translation>Connect From Cloud</Translation>
                </Button>
                <Button
                  type="primary"
                  style={{ marginRight: '16px' }}
                  onClick={() => {
                    this.setState({ showAddCluster: true });
                  }}
                >
                  <Translation>Connect Existing Cluster</Translation>
                </Button>
              </Permission>
            </Fragment>,
          ]}
        />

        <If condition={isShowAddonMessage && addonMessage.length != 0}>
          <Message type="notice" closeable onClose={this.handleHiddenAddonMessage}>
            Connect Cluster Success! Please upgrade {this.showAddonMessage()} addons, make them take effect in the new
            cluster.
          </Message>
        </If>

        <SelectSearch
          query={(q: string) => {
            this.query(q);
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
              onPropsOK={() => {
                this.onGetEnabledAddon();
              }}
              dispatch={dispatch}
            />
          </If>
          <If condition={showAddCluster}>
            <AddClusterDialog
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
                this.onGetEnabledAddon();
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
