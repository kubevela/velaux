import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import SelectSearch from './components/SelectSearch';
import CardContend from './components/CardContent';
import { APPLICATION_PATH, WORKFLOWS_PATH } from '../../utils/common';
import '../../common.less';

type Props = {
  dispatch: ({}) => {};
  applicationList: [];
  namespaceList: [];
  clusterList?: [];
};
type State = {};

@connect((store: any) => {
  return { ...store.application, ...store.clusters };
})
class Application extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
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
    return (
      <div>
        <Title
          title="App Manager"
          subTitle="App ManagerSubTitle"
          btnName="Add App"
          dialogName={APPLICATION_PATH}
          namespaceList={namespaceList}
          clusterList={clusterList}
          dispatch={dispatch}
        />

        <SelectSearch namespaceList={namespaceList} clusterList={clusterList} dispatch={dispatch} />

        <CardContend
          appContent={applicationList}
          path={APPLICATION_PATH}
          workFlowPath={WORKFLOWS_PATH}
        />
      </div>
    );
  }
}

export default Application;
