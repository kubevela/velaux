import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { Loading, Message } from '@b-design/ui';
import CardContend from '../ApplicationList/components/CardContent';
import type { ApplicationBase, ApplicationQuery } from '../../interface/application';
import {
  getApplicationList,
  deleteApplicationPlan,
  getComponentDefinitions,
} from '../../api/application';
import { getEnvs } from '../../api/env';
import { If } from 'tsx-control-statements/components';
import EditAppDialog from '../ApplicationList/components/EditAppDialog';
import AppDialog from '../ApplicationList/components/AddAppDialog';
import SelectSearch from './components/SelectSearch';
import type { LoginUserInfo } from '../../interface/user';
import { getProjectTargetList } from '../../api/project';

type Props = {
  applicationList: ApplicationBase[];
  match: {
    params: {
      projectName: string;
    };
  };
  dispatch: ({}) => {};
  history: any;
  userInfo?: LoginUserInfo;
};

type State = {
  isLoading: boolean;
  applicationList: ApplicationBase[];
  editApplicationItem: ApplicationBase;
  targets?: [];
  envs?: [];
  componentDefinitions: [];
  isEditApplication: boolean;
  isAddApplication: boolean;
};

@connect((store: any) => {
  return { ...store, ...store.user };
})
class ProjectApplications extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      applicationList: [],
      editApplicationItem: {
        name: '',
        alias: '',
        icon: '',
        description: '',
        createTime: '',
      },
      envs: [],
      componentDefinitions: [],
      isEditApplication: false,
      isAddApplication: false,
    };
  }

  componentDidMount() {
    this.listApplication();
    this.listProjectTargets();
    this.listEnvs();
    this.onGetComponentDefinitions();
  }

  listApplication = async (queryData?: ApplicationQuery) => {
    const { params = { projectName: '' } } = this.props.match;
    const { query = '', env = '', targetName = '' } = queryData || {};
    const queryParams: ApplicationQuery = {
      query,
      env,
      targetName,
      project: params.projectName,
    };
    this.setState({ isLoading: true });
    getApplicationList(queryParams)
      .then((res) => {
        if (res) {
          this.setState({ applicationList: res.applications || [] });
        }
      })
      .catch(() => {})
      .finally(() => {
        this.setState({ isLoading: false });
      });
  };

  listProjectTargets = async () => {
    const { params = { projectName: '' } } = this.props.match;
    getProjectTargetList({ projectName: params.projectName }).then((res) => {
      if (res) {
        this.setState({ targets: res.targets || [] });
      }
    });
  };

  listEnvs = async () => {
    const { params = { projectName: '' } } = this.props.match;
    getEnvs({ project: params.projectName }).then((res) => {
      if (res) {
        this.setState({ envs: res.envs || [] });
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

  editApplicationPlan = (editApplicationItem: ApplicationBase) => {
    this.setState({
      editApplicationItem,
      isEditApplication: true,
    });
  };

  onDeleteApplicationItem = (name: string) => {
    deleteApplicationPlan({ name: name }).then((re) => {
      if (re) {
        Message.success('Application delete success');
        this.listApplication();
      }
    });
  };

  closeAddApplication = () => {
    this.setState({
      isAddApplication: false,
    });
    this.listApplication();
  };

  closeEditAppDialog = () => {
    this.setState({
      isEditApplication: false,
    });
    this.listApplication();
  };

  render() {
    const { dispatch, userInfo } = this.props;
    const {
      isLoading,
      applicationList,
      isAddApplication,
      isEditApplication,
      editApplicationItem,
      targets,
      envs,
      componentDefinitions,
    } = this.state;
    const { params = { projectName: '' } } = this.props.match;
    const { projectName } = params;

    return (
      <Fragment>
        <div className="full-container">
          <SelectSearch
            targetList={targets}
            envs={envs}
            projectName={projectName}
            listApplication={(queryData: ApplicationQuery) => {
              this.listApplication(queryData);
            }}
            onAddApplication={() => {
              this.setState({ isAddApplication: true });
            }}
          />
          <Loading visible={isLoading} fullScreen>
            <CardContend
              projectName={projectName}
              applications={applicationList}
              editAppPlan={(editItem: ApplicationBase) => {
                this.editApplicationPlan(editItem);
              }}
              deleteAppPlan={this.onDeleteApplicationItem}
              setVisible={(visible) => {
                this.setState({ isAddApplication: visible });
              }}
            />
          </Loading>

          <If condition={isAddApplication}>
            <AppDialog
              visible={isAddApplication}
              targets={targets}
              projects={userInfo?.projects}
              userInfo={userInfo}
              isDisableProject={true}
              projectName={projectName}
              componentDefinitions={componentDefinitions}
              setVisible={(visible) => {
                this.setState({ isAddApplication: visible });
              }}
              onOK={() => {
                this.setState({ isAddApplication: false });
                this.listApplication();
              }}
              onClose={this.closeAddApplication}
              dispatch={dispatch}
            />
          </If>

          <If condition={isEditApplication}>
            <EditAppDialog
              editItem={editApplicationItem}
              onOK={this.closeEditAppDialog}
              onClose={this.closeEditAppDialog}
            />
          </If>
        </div>
      </Fragment>
    );
  }
}

export default ProjectApplications;
