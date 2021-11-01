import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import SelectSearch from './components/SelectSearch';
import CardContend from './components/CardContent';
import AppDialog from './components/AddAppDialog';
import { APPLICATION_PATH, WORKFLOWS_PATH } from '../../utils/common';
import '../../common.less';
import { If } from 'tsx-control-statements/components';

type Props = {
  dispatch: ({}) => {};
  applicationList: [];
  namespaceList: [];
  clusterList?: [];
};
type State = {
  showAddApplication: boolean;
};

@connect((store: any) => {
  return { ...store.application, ...store.clusters };
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
    const { applicationList, namespaceList, clusterList, dispatch } = this.props;
    const { showAddApplication } = this.state;
    return (
      <div>
        <Title
          title="App Manager"
          subTitle="App ManagerSubTitle"
          addButtonTitle="Add App"
          addButtonClick={() => {
            this.setState({ showAddApplication: true });
          }}
        />

        <SelectSearch namespaceList={namespaceList} clusterList={clusterList} dispatch={dispatch} />

        <CardContend
          appContent={applicationList}
          path={APPLICATION_PATH}
          workFlowPath={WORKFLOWS_PATH}
        />
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
