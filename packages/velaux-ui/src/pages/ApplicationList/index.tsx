import { Message, Loading, Button } from '@alifd/next';
import { connect } from 'dva';
import React, { Component } from 'react';

import { deleteApplication } from '../../api/application';
import { getComponentDefinitions } from '../../api/definitions';
import { If } from '../../components/If';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { ApplicationBase , LoginUserInfo } from '@velaux/data';

import AppDialog from './components/AddAppDialog';
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
};

export type ShowMode = 'table' | 'card' | string | null;

type State = {
  showAddApplication: boolean;
  componentDefinitions: [];
  isLoading: boolean;
  showEditApplication: boolean;
  editItem?: ApplicationBase;
  labelValue: string[];
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
      labelValue: [],
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
    const { applicationList, targets, dispatch, envs, userInfo } = this.props;
    const { showAddApplication, componentDefinitions, isLoading, showEditApplication, editItem, labelValue, showMode } =
      this.state;
    let appLabels: string[] = [];
    applicationList?.map((app) => {
      app.labels &&
        Object.keys(app.labels).map((key: string) => {
          if (key.indexOf('ux.oam.dev') < 0 && key.indexOf('app.oam.dev')) {
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
          projects={userInfo?.projects}
          appLabels={appLabels}
          dispatch={dispatch}
          setLabelValue={this.setLabelValue}
          labelValue={labelValue}
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
            clickLabelFilter={this.clickLabelFilter}
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
          <EditAppDialog editItem={editItem} onOK={this.closeEditAppDialog} onClose={this.closeEditAppDialog} />
        </If>
      </div>
    );
  }
}

export default Application;
