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
import { AppPlanBase } from '../../interface/application';

type Props = {
  dispatch: ({ }) => {};
  applicationPlanList: AppPlanBase[];
  namespaceList: [];
  clusterList?: [];
};
type State = {
  visibleDraw: boolean;
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
      visibleDraw: false,
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
          isLoading: false
        })
      }
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
      visibleDraw: false,
    });
    this.getApplicationPlans({});
  };

  render() {
    const { applicationPlanList, namespaceList, clusterList, dispatch } = this.props;
    const { visibleDraw, componentDefinitions, isLoading } = this.state;
    return (
      <div>
        <Title
          title="Application Manager"
          subTitle="Application Manager SubTitle"
          addButtonTitle="Add App"
          addButtonClick={() => {
            this.setState({ visibleDraw: true });
          }}
        />

        <SelectSearch
          namespaceList={namespaceList}
          clusterList={clusterList}
          dispatch={dispatch}
          getApplicationPlans={(params: any) => { this.getApplicationPlans(params) }}
        />
        <Loading visible={isLoading} fullScreen>
          <CardContend
            appPlans={applicationPlanList}
            editAppPlan={(name: string) => { }}
            deleteAppPlan={this.onDeleteAppPlan}
          />
        </Loading>
        <If condition={visibleDraw}>
          <AppDialog
            visible={visibleDraw}
            namespaceList={namespaceList}
            clusterList={clusterList}
            componentDefinitions={componentDefinitions}
            setVisible={(visible) => {
              this.setState({ visibleDraw: visible });
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
