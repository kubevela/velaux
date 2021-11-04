import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import { Message } from '@b-design/ui';
import SelectSearch from './components/SelectSearch';
import CardContend from './components/CardContent';
import AppDialog from './components/AddAppDialog';
import '../../common.less';
import { If } from 'tsx-control-statements/components';
import { deleteApplicationPlan } from '../../api/application';

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
    this.getApplications();
    this.getNamespaceList();
    this.getClusterList();
  }

  getApplications = async () => {
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

  onDeleteAppPlan = (name: string) => {
    deleteApplicationPlan({ name: name }).then((re) => {
      if (re) {
        Message.success('application plan delete success');
        this.getApplications();
      }
    });
  };

  render() {
    const { applicationList, namespaceList, clusterList, dispatch } = this.props;
    const { showAddApplication } = this.state;
    return (
      <div>
        <Title
          title="AppPlan Manager"
          subTitle="AppPlan ManagerSubTitle"
          addButtonTitle="Add App"
          addButtonClick={() => {
            this.setState({ showAddApplication: true });
          }}
        />

        <SelectSearch namespaceList={namespaceList} clusterList={clusterList} dispatch={dispatch} />

        <CardContend
          appPlans={applicationList}
          editAppPlan={(name: string) => {}}
          deleteAppPlan={this.onDeleteAppPlan}
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
