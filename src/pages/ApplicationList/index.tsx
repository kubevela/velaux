import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import { Message, Loading, Button } from '@b-design/ui';
import SelectSearch from './components/SelectSearch';
import CardContend from './components/CardContent';
import AppDialog from './components/AddAppDialog';
import { If } from 'tsx-control-statements/components';
import { deleteApplication } from '../../api/application';
import { getComponentDefinitions } from '../../api/definitions';
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

export type ShowMode = 'table' | 'card' | string | null;

type State = {
  showAddApplication: boolean;
  componentDefinitions: [];
  isLoading: boolean;
  showEditApplication: boolean;
  editItem?: ApplicationBase;
  showMode: ShowMode;
};

@connect((store: any) => {
  return { ...store.application, ...store.target, ...store.clusters, ...store.env, ...store.user };
})
class Application extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    let mode: ShowMode = localStorage.getItem('application-list-mode');
    if (mode != 'table' && mode != 'card') {
      mode = 'card';
    }
    this.state = {
      showAddApplication: false,
      componentDefinitions: [],
      isLoading: false,
      showEditApplication: false,
      showMode: mode,
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

  onDeleteApp = (name: string) => {
    deleteApplication({ name: name }).then((re) => {
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
    const {
      showAddApplication,
      componentDefinitions,
      isLoading,
      showEditApplication,
      editItem,
      showMode,
    } = this.state;
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
          showMode={showMode}
          setMode={(mode: ShowMode) => {
            this.setState({ showMode: mode });
            if (mode) {
              localStorage.setItem('application-list-mode', mode);
            }
          }}
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
            showMode={showMode}
            deleteAppPlan={this.onDeleteApp}
            setVisible={(visible) => {
              this.setState({ showAddApplication: visible });
            }}
          />
        </Loading>

        <If condition={showAddApplication}>
          <AppDialog
            visible={showAddApplication}
            targets={targets}
            userInfo={userInfo}
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
