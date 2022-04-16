import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import { Message, Loading, Button } from '@b-design/ui';
import SelectSearch from './components/SelectSearch';
import CardContend from './components/CardContent';
import AppDialog from './components/AddAppDialog';
import '../../common.less';
import { If } from 'tsx-control-statements/components';
import { deleteApplicationPlan, getComponentDefinitions } from '../../api/application';
import type { ApplicationBase } from '../../interface/application';
import EditAppDialog from './components/EditAppDialog';
import EditPlatFormUserDialog from './components/EditPlatFormUserDialog';
import type { LoginUserInfo } from '../../interface/user';
import Permission from '../../components/Permission';
import Translation from '../../components/Translation';
import _ from 'lodash';

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
  userInfo?: LoginUserInfo;
  isEditAdminUser: boolean;
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
      isEditAdminUser: false,
      userInfo: props.userInfo,
    };
  }

  componentDidMount() {
    this.getApplications({});
    this.getEnvs();
    this.onGetComponentDefinitions();
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.userInfo !== this.props.userInfo) {
      this.setState({ userInfo: nextProps.userInfo }, () => {
        this.isEditPlatForm();
      });
    }
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
        Message.success('application delete success');
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

  isEditPlatForm = () => {
    const { userInfo } = this.state;
    const isAdminUser = this.isAdminUserCheck();
    if (isAdminUser && userInfo && !userInfo.email) {
      this.setState({
        isEditAdminUser: true,
      });
    }
  };

  isAdminUserCheck = () => {
    const { userInfo } = this.state;
    const platformPermissions = userInfo?.platformPermissions || [];
    const findAdminUser = _.find(platformPermissions, (item) => {
      return item.name === 'admin';
    });
    if (findAdminUser) {
      return true;
    } else {
      return false;
    }
  };

  onCloseEditAdminUser = () => {
    this.setState({ isEditAdminUser: false });
  };

  render() {
    const { applicationList, targets, dispatch, envs } = this.props;
    const {
      showAddApplication,
      componentDefinitions,
      isLoading,
      showEditApplication,
      editItem,
      isEditAdminUser,
      userInfo,
    } = this.state;

    return (
      <div>
        <Title
          title="Applications"
          subTitle="Deploy and manage all your applications"
          extButtons={[
            <Permission
              request={{ resource: 'project/application:*', action: 'create' }}
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
        <If condition={isEditAdminUser}>
          <EditPlatFormUserDialog userInfo={userInfo} onClose={this.onCloseEditAdminUser} />
        </If>
      </div>
    );
  }
}

export default Application;
