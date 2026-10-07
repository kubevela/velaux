import { Message, Loading, Button } from '@alifd/next';
import { connect } from 'dva';
import React, { Component } from 'react';
import type { HealthFilter } from './components/AppStatus/health';
import { byHealth, healthCounts } from './components/AppStatus/health';
import { HealthChips } from './components/HealthChips';
import { visibleLabels } from '../../utils/appMeta';

import { projectChanged, scopedTo } from '../../utils/currentProject';
import { deleteApplication } from '../../api/application';
import { If } from '../../components/If';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { ApplicationBase, Env, LoginUserInfo } from '@velaux/data';

import { NewServiceDialog } from './components/NewServiceDialog';
import CardContend from './components/CardContent';
import EditAppDialog from './components/EditAppDialog';
import SelectSearch from './components/SelectSearch';

type Props = {
  dispatch: ({}) => {};
  applicationList?: ApplicationBase[];
  targets?: [];
  envs?: [];
  history: any;
  userInfo?: LoginUserInfo;
  currentProject?: { current: string; resolved: boolean };
};

export type ShowMode = 'table' | 'card' | string | null;

type State = {
  showAddApplication: boolean;
  isLoading: boolean;
  showEditApplication: boolean;
  editItem?: ApplicationBase;
  labelValue: string[];
  showMode: ShowMode;
  health: HealthFilter;
};

@connect((store: any) => {
  return {
    ...store.application,
    ...store.target,
    ...store.clusters,
    ...store.env,
    ...store.user,
    currentProject: store.currentProject,
  };
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
      labelValue: [],
      isLoading: false,
      showEditApplication: false,
      showMode: mode,
      health: 'all',
    };
  }

  componentDidMount() {
    this.getApplications({});
    this.getEnvs();
  }

  componentDidUpdate(prev: Props) {
    if (projectChanged(prev.currentProject, this.props.currentProject)) {
      this.getApplications({});
      this.getEnvs();
    }
  }

  // getApplications lists the picked project's applications, or every project's
  // for all of them, and not before the project is known.
  getApplications = async (params: any) => {
    if (!this.props.currentProject?.resolved) {
      return;
    }
    this.setState({ isLoading: true });
    this.props.dispatch({
      type: 'application/getApplicationList',
      payload: { ...params, project: this.props.currentProject.current, withStatus: true },
      callback: () => {
        this.setState({
          isLoading: false,
        });
      },
    });
  };

  // getEnvs lists the environments the Environment filter offers, the picked
  // project's.
  getEnvs = async () => {
    if (!this.props.currentProject?.resolved) {
      return;
    }
    this.props.dispatch({
      type: 'env/listEnvs',
      payload: { project: this.props.currentProject.current },
    });
  };

  setLabelValue = async (labels: string[]) => {
    this.setState({
      labelValue: labels,
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

  clickLabelFilter = (label: string) => {
    let { labelValue } = this.state;
    let existIndex = -1;
    labelValue.map((key, index) => {
      if (key == label) {
        existIndex = index;
        return;
      }
    });
    if (existIndex == -1) {
      labelValue.push(label);
    } else {
      labelValue = labelValue.splice(existIndex, existIndex);
    }
    this.setState({
      labelValue,
    });
    this.getApplications({ labels: labelValue.join(',') });
  };

  render() {
    const { dispatch, envs, userInfo } = this.props;
    const applicationList = scopedTo(this.props.applicationList, this.props.currentProject, (a) => a.project?.name);
    const { showAddApplication, isLoading, showEditApplication, editItem, labelValue, showMode } = this.state;
    let appLabels: string[] = [];
    applicationList?.map((app) => {
      app.labels &&
        Object.keys(app.labels).map((key: string) => {
          if (visibleLabels(app.labels).includes(key)) {
            if (app.labels) {
              appLabels.push(key + '=' + app.labels[key]);
            }
          }
        });
    });
    return (
      <div>
        <ListTitle
          title="Applications"
          subTitle="Deploy and manage all your applications"
          extButtons={[
            <Permission request={{ resource: 'project:?/application:*', action: 'create' }} project={'?'}>
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
          appLabels={appLabels}
          dispatch={dispatch}
          setLabelValue={this.setLabelValue}
          labelValue={labelValue}
          envs={scopedTo(envs, this.props.currentProject, (env: Env) => env.project?.name)}
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
        <HealthChips
          counts={healthCounts(applicationList || [])}
          value={this.state.health}
          onChange={(health: HealthFilter) => this.setState({ health })}
        />
        <Loading visible={isLoading} fullScreen>
          <CardContend
            applications={byHealth(applicationList || [], this.state.health)}
            editAppPlan={(item: ApplicationBase) => {
              this.editAppPlan(item);
            }}
            clickLabelFilter={this.clickLabelFilter}
            showMode={showMode}
            deleteAppPlan={this.onDeleteApp}
            setVisible={(visible) => {
              this.setState({ showAddApplication: visible });
            }}
          />
        </Loading>
        <If condition={showAddApplication}>
          <NewServiceDialog
            projects={userInfo?.projects}
            project={this.props.currentProject?.current || undefined}
            onClose={this.closeAddApplication}
            onCreated={(name: string) => {
              this.props.history.push(`/applications/${name}/config`);
            }}
          />
        </If>

        <If condition={showEditApplication && editItem}>
          <EditAppDialog editItem={editItem} onOK={this.closeEditAppDialog} onClose={this.closeEditAppDialog} />
        </If>
      </div>
    );
  }
}

export default Application;
