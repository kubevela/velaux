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
import type { ApplicationBase } from '../../interface/application';

type Props = {
  dispatch: ({}) => {};
  applicationList: ApplicationBase[];
  namespaceList: [];
  deliveryTargets?: [];
  history: any;
};
type State = {
  showAddApplication: boolean;
  componentDefinitions: [];
  isLoading: boolean;
};

@connect((store: any) => {
  return { ...store.application, ...store.deliveryTarget };
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
    this.getApplications({});
    this.getNamespaceList();
    this.getDeliveryTarget();
    this.onGetComponentdefinitions();
  }

  getApplications = async (params: any) => {
    this.setState({ isLoading: true });
    this.props.dispatch({
      type: 'application/getApplicationList',
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

  getDeliveryTarget = async () => {
    this.props.dispatch({
      type: 'deliveryTarget/listTargets',
      payload: {},
    });
  };

  onDeleteAppPlan = (name: string) => {
    deleteApplicationPlan({ name: name }).then((re) => {
      if (re) {
        Message.success('application delete success');
        this.getApplications({});
      }
    });
  };

  onGetComponentdefinitions = async () => {
    getComponentdefinitions().then((res) => {
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
    this.getApplications({});
  };

  render() {
    const { applicationList, namespaceList, deliveryTargets, dispatch } = this.props;
    const { showAddApplication, componentDefinitions, isLoading } = this.state;
    return (
      <div>
        <Title
          title="Applications"
          subTitle="Deploy and manage all your applications"
          addButtonTitle="New Application"
          addButtonClick={() => {
            this.setState({ showAddApplication: true });
          }}
        />

        <SelectSearch
          namespaceList={namespaceList}
          deliveryTargetList={deliveryTargets}
          dispatch={dispatch}
          getApplications={(params: any) => {
            this.getApplications(params);
          }}
        />

        <Loading visible={isLoading} fullScreen>
          <CardContend
            applications={applicationList}
            editAppPlan={() => {}}
            deleteAppPlan={this.onDeleteAppPlan}
          />
        </Loading>

        <If condition={showAddApplication}>
          <AppDialog
            visible={showAddApplication}
            namespaceList={namespaceList}
            componentDefinitions={componentDefinitions}
            setVisible={(visible) => {
              this.setState({ showAddApplication: visible });
            }}
            onOK={(name: string) => {
              this.props.history.push(`/applications/${name}/config`);
            }}
            onClose={this.closeAddApplication}
            dispatch={dispatch}
          />
        </If>
      </div>
    );
  }
}

export default Application;
