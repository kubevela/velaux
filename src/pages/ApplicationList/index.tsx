import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import { Message, Loading } from '@b-design/ui';
import SelectSearch from './components/SelectSearch';
import CardContend from './components/CardContent';
import AppDialog from './components/AddAppDialog';
import '../../common.less';
import { If } from 'tsx-control-statements/components';
import { deleteApplicationPlan, getComponentdefinitions } from '../../api/application';
import { ApplicationBase } from '../../interface/application';

type Props = {
  dispatch: ({}) => {};
  applicationList: ApplicationBase[];
  namespaceList: [];
  clusterList?: [];
};
type State = {
  showAddApplication: boolean;
  componentDefinitions: [];
  isLoading: boolean;
};

@connect((store: any) => {
  return { ...store.application, ...store.clusters };
})
class Application extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showAddApplication: false,
      componentDefinitions: [],
      isLoading: false,
    };
  }

  componentDidMount() {
    this.getApplicationPlans({});
    this.getNamespaceList();
    this.getClusterList();
    this.onGetComponentdefinitions();
  }

  getApplicationPlans = async (params: any) => {
    this.setState({ isLoading: true });
    this.props.dispatch({
      type: 'application/getApplicationPlanList',
      payload: params,
      callback: () => {
        this.setState({
          isLoading: false,
        });
      },
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
        Message.success('application delete success');
        this.getApplicationPlans({});
      }
    });
  };

  onGetComponentdefinitions = async () => {
    getComponentdefinitions({}).then((res) => {
      if (res) {
        this.setState({
          componentDefinitions: res && res.definitions,
        });
      }
    });
  };

  closeAddApplication = () => {
    this.setState({
      showAddApplication: false,
    });
    this.getApplicationPlans({});
  };

  render() {
    const { applicationList, namespaceList, clusterList, dispatch } = this.props;
    const { showAddApplication, componentDefinitions, isLoading } = this.state;
    return (
      <div>
        <Title
          title="Application Manager"
          subTitle="Application Manager SubTitle"
          addButtonTitle="New Application"
          addButtonClick={() => {
            this.setState({ showAddApplication: true });
          }}
        />

        <SelectSearch
          namespaceList={namespaceList}
          clusterList={clusterList}
          dispatch={dispatch}
          getApplicationPlans={(params: any) => {
            this.getApplicationPlans(params);
          }}
        />

        <Loading visible={isLoading} fullScreen>
          <CardContend
            applications={applicationList}
            editAppPlan={(name: string) => {}}
            deleteAppPlan={this.onDeleteAppPlan}
          />
        </Loading>

        <If condition={showAddApplication}>
          <AppDialog
            visible={showAddApplication}
            namespaceList={namespaceList}
            clusterList={clusterList}
            componentDefinitions={componentDefinitions}
            setVisible={(visible) => {
              this.setState({ showAddApplication: visible });
            }}
            onOK={this.closeAddApplication}
            onClose={this.closeAddApplication}
            dispatch={dispatch}
          />
        </If>
      </div>
    );
  }
}

export default Application;
