import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { Loading, Message } from '@b-design/ui';
import CardContend from '../ApplicationList/components/CardContent';
import { ApplicationBase, ApplicationQuery } from '../../interface/application';
import type { Project } from '../../interface/project';
import {
  getApplicationList,
  deleteApplicationPlan,
  getComponentDefinitions,
} from '../../api/application';
import { getTarget } from '../../api/target';
import { getProjectList } from '../../api/project';
import { getEnvs } from '../../api/env';
import { If } from 'tsx-control-statements/components';
import EditAppDialog from '../ApplicationList/components/EditAppDialog';
import AppDialog from '../ApplicationList/components/AddAppDialog';
import SelectSearch from './components/SelectSearch';

type Props = {
  applicationList: ApplicationBase[];
  match: {
    params: {
      projectName: string;
    };
  };
  dispatch: ({}) => {};
  history: any;
};

type State = {
  isLoading: boolean;
  applicationList: ApplicationBase[];
  editApplicationItem: ApplicationBase;
  targets?: [];
  projects?: Project[];
  envs?: [];
  componentDefinitions: [];
  isEditApplication: boolean;
  isAddApplication: boolean;
};

@connect((store: any) => {
  return { ...store };
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
      projects: [{ name: '' }],
      componentDefinitions: [],
      isEditApplication: false,
      isAddApplication: false,
    };
  }

  componentDidMount() {
    this.listApplication();
    this.listTargets();
    this.listEnvs();
    this.getProjectList();
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
        this.setState({ applicationList: res.applications || [] });
      })
      .catch(() => {})
      .finally(() => {
        this.setState({ isLoading: false });
      });
  };

  listTargets = async () => {
    getTarget({}).then((res) => {
      this.setState({ targets: (res && res.targets) || [] });
    });
  };

  listEnvs = async () => {
    getEnvs({}).then((res) => {
      this.setState({ envs: (res && res.envs) || [] });
    });
  };

  getProjectList = async () => {
    getProjectList({}).then((res) => {
      this.setState({ projects: (res && res.projects) || [] });
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
    const { dispatch } = this.props;
    const {
      isLoading,
      applicationList,
      isAddApplication,
      isEditApplication,
      editApplicationItem,
      targets,
      envs,
      projects,
      componentDefinitions,
    } = this.state;
    const { params = { projectName: '' } } = this.props.match;
    const { projectName } = params;

    return (
      <Fragment>
        <SelectSearch
          targetList={targets}
          envs={envs}
          listApplication={(queryData: ApplicationQuery) => {
            this.listApplication(queryData);
          }}
          onAddApplication={() => {
            this.setState({ isAddApplication: true });
          }}
        />
        <Loading visible={isLoading} fullScreen>
          <CardContend
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
            syncProjectList={this.getProjectList}
            projects={projects}
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
      </Fragment>
    );
  }
}

export default ProjectApplications;
