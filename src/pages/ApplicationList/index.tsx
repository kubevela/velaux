import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import { Message, Loading, Button } from '@b-design/ui';
import SelectSearch from './components/SelectSearch';
import CardContend from './components/CardContent';
import AppDialog from './components/AddAppDialog';
import { If } from 'tsx-control-statements/components';
import { deleteApplicationPlan, getComponentDefinitions } from '../../api/application';
import type { ApplicationBase } from '../../interface/application';
import EditAppDialog from './components/EditAppDialog';
import type { LoginUserInfo } from '../../interface/user';
import Permission from '../../components/Permission';
import Translation from '../../components/Translation';

type Props = {
  dispatch: ({}) => {};
  applicationList: ApplicationBase[];
  targets?: [];
  envs?: [];
  history: any;
  userInfo?: LoginUserInfo;
};
type State = {
  showAddApplication: boolean;
  componentDefinitions: [];
  isLoading: boolean;
  showEditApplication: boolean;
  editItem?: ApplicationBase;
};

@connect((store: any) => {
  return { ...store.application, ...store.target, ...store.clusters, ...store.env, ...store.user };
})
class Application extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showAddApplication: false,
      componentDefinitions: [],
      isLoading: false,
      showEditApplication: false,
    };
  }

  componentDidMount() {
    this.getApplications({});
    this.getEnvs();
    this.onGetComponentDefinitions();
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

  getEnvs = async () => {
    this.props.dispatch({
      type: 'env/listEnvs',
      payload: {},
    });
  };

  onDeleteAppPlan = (name: string) => {
    deleteApplicationPlan({ name: name }).then((re) => {
      if (re) {
        Message.success('Application deleted successfully');
        this.getApplications({});
      }
    });
  };

  onGetComponentDefinitions = async () => {
    getComponentDefinitions().then((res) => {
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

  closeEditAppDialog = () => {
    this.setState({
      showEditApplication: false,
    });
    this.getApplications({});
  };

  editAppPlan = (editItem: ApplicationBase) => {
    this.setState({
      editItem,
      showEditApplication: true,
    });
  };

  render() {
    const { applicationList, targets, dispatch, envs, userInfo } = this.props;
    const { showAddApplication, componentDefinitions, isLoading, showEditApplication, editItem } =
      this.state;
    return (
      <div>
        <Title
          title="Applications"
          subTitle="Deploy and manage all your applications"
          extButtons={[
            <Permission
              request={{ resource: 'project:?/application:*', action: 'create' }}
              project={'?'}
            >
              <Button
                type="primary"
                onClick={() => {
                  this.setState({ showAddApplication: true });
                }}
              >
                <Translation>New Application</Translation>
              </Button>
            </Permission>,
          ]}
        />

        <SelectSearch
          projects={userInfo?.projects}
          dispatch={dispatch}
          envs={envs}
          getApplications={(params: any) => {
            this.getApplications(params);
          }}
        />
        <Loading visible={isLoading} fullScreen>
          <CardContend
            applications={applicationList}
            editAppPlan={(item: ApplicationBase) => {
              this.editAppPlan(item);
            }}
            deleteAppPlan={this.onDeleteAppPlan}
            setVisible={(visible) => {
              this.setState({ showAddApplication: visible });
            }}
          />
        </Loading>

        <If condition={showAddApplication}>
          <AppDialog
            visible={showAddApplication}
            targets={targets}
            projects={userInfo?.projects}
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

        <If condition={showEditApplication && editItem}>
          <EditAppDialog
            editItem={editItem}
            onOK={this.closeEditAppDialog}
            onClose={this.closeEditAppDialog}
          />
        </If>
      </div>
    );
  }
}

export default Application;
