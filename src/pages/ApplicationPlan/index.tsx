import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import SelectSearch from './components/SelectSearch';
import CardContend from './components/CardContent';
import AppDialog from './components/AddAppDialog';
import NoData from '../../components/Nodata';
import { APPLICATION_PATH, WORKFLOWS_PATH } from '../../utils/common';
import { Loading } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import '../../common.less';

type Props = {
  dispatch: ({}) => {};
  applicationList: [];
  namespaceList: [];
  clusterList?: [];
  loading: { global: Boolean };
};
type State = {
  showAddApplication: boolean;
};

@connect((store: any) => {
  return { ...store.application, ...store.clusters, loading: store.loading };
})
class Application extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showAddApplication: false,
    };
  }

  componentDidMount() {
    this.getApplication();
    this.getNamespaceList();
    this.getClusterList();
  }

  getApplication = async () => {
    this.props.dispatch({
      type: 'application/getApplicationList',
      payload: {},
    });
  };

  getNamespaceList = async () => {
    this.props.dispatch({
      type: 'application/getNamespaceList',
      payload: {},
    });
  };

  getClusterList = async () => {
    this.props.dispatch({
      type: 'clusters/getClusterList',
    });
  };

  render() {
    const { applicationList, namespaceList, clusterList, loading, dispatch } = this.props;
    const { showAddApplication } = this.state;
    const isLoading = loading.global ? true : false;
    return (
      <div>
        <Title
          title="Application delivery plan management"
          subTitle="Manage your application delivery plan"
          addButtonTitle="New application delivery plan"
          addButtonClick={() => {
            this.setState({ showAddApplication: true });
          }}
        />
        <Loading tip="loading..." fullScreen visible={isLoading}>
          <SelectSearch
            namespaceList={namespaceList}
            clusterList={clusterList}
            dispatch={dispatch}
          />
          <CardContend
            appContent={applicationList}
            path={APPLICATION_PATH}
            workFlowPath={WORKFLOWS_PATH}
          />
        </Loading>

        <If condition={!applicationList || applicationList.length == 0}>
          <NoData width="300px" />
        </If>

        <If condition={showAddApplication}>
          <AppDialog
            visible={showAddApplication}
            setVisible={(visible) => {
              this.setState({ showAddApplication: visible });
            }}
            dispatch={dispatch}
            namespaceList={namespaceList}
            clusterList={clusterList}
          />
        </If>
      </div>
    );
  }
}

export default Application;
