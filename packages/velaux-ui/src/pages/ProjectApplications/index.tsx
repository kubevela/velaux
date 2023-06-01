import { Loading, Message } from '@alifd/next';
import { connect } from 'dva';
import React, { Component, Fragment } from 'react';

import { getApplicationList, deleteApplication } from '../../api/application';
import { getComponentDefinitions } from '../../api/definitions';
import { getEnvs } from '../../api/env';
import { getProjectTargetList } from '../../api/project';
import { If } from '../../components/If';
import type { ApplicationBase, ApplicationQuery , LoginUserInfo } from '@velaux/data';
import type { ShowMode } from '../ApplicationList';
import AppDialog from '../ApplicationList/components/AddAppDialog';
import CardContend from '../ApplicationList/components/CardContent';
import EditAppDialog from '../ApplicationList/components/EditAppDialog';

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
  labelValue: string[];
  showMode: ShowMode;
};

@connect((store: any) => {
  return { ...store, ...store.user };
})
class ProjectApplications extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    let mode: ShowMode = localStorage.getItem('application-list-mode');
    if (mode != 'table' && mode != 'card') {
      mode = 'card';
    }
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
      labelValue: [],
      isEditApplication: false,
      isAddApplication: false,
      showMode: mode,
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
    const { query = '', env = '', targetName = '', labels = '', } = queryData || {};
    const queryParams: ApplicationQuery = {
      query,
      env,
      targetName,
      labels,
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

  setLabelValue = async (labels: string[]) => {
    this.setState({
      labelValue: labels,
    });
  };

  editApplicationPlan = (editApplicationItem: ApplicationBase) => {
    this.setState({
      editApplicationItem,
      isEditApplication: true,
    });
  };

  onDeleteApplicationItem = (name: string) => {
    deleteApplication({ name: name }).then((re) => {
      if (re) {
        Message.success('Application deleted successfully');
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

  clickLabelFilter = (label: string) => {
    let { labelValue } = this.state;
    let existIndex = -1;
    labelValue.map((key, index) => {
      if (key == label) {
        existIndex = index
        return
      }
    });
    if (existIndex == -1) {
      labelValue.push(label)
    } else {
      labelValue = labelValue.splice(existIndex, existIndex);
    }
    this.setState({
      labelValue
    });
    this.listApplication({labels: labelValue.join(",")});
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
      labelValue,
    } = this.state;
    const { params = { projectName: '' } } = this.props.match;
    const { projectName } = params;
    let appLabels: string[] = []
    applicationList.map((app) => {
      app.labels && Object.keys(app.labels).map((key: string) => {
        if (key.indexOf("ux.oam.dev") < 0 && key.indexOf("app.oam.dev")) {
          if (app.labels) { appLabels.push(key+"="+app.labels[key]) }
        }
      })
    })

    return (
      <Fragment>
        <div className="full-container">
          <SelectSearch
            targetList={targets}
            envs={envs}
            appLabels={appLabels}
            setLabelValue={this.setLabelValue}
            labelValue={labelValue}
            projectName={projectName}
            listApplication={(queryData: ApplicationQuery) => {
              this.listApplication(queryData);
            }}
            onAddApplication={() => {
              this.setState({ isAddApplication: true });
            }}
            setMode={(mode: ShowMode) => {
              this.setState({ showMode: mode });
              if (mode) {
                localStorage.setItem('application-list-mode', mode);
              }
            }}
            showMode={this.state.showMode}
          />
          <Loading visible={isLoading} fullScreen>
            <CardContend
              projectName={projectName}
              applications={applicationList}
              editAppPlan={(editItem: ApplicationBase) => {
                this.editApplicationPlan(editItem);
              }}
              showMode={this.state.showMode}
              clickLabelFilter={this.clickLabelFilter}
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
