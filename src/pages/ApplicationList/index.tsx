import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import { Message, Loading } from '@b-design/ui';
import SelectSearch from './components/SelectSearch';
import CardContend from './components/CardContent';
import AppDialog from './components/AddAppDialog';
import '../../common.less';
import { If } from 'tsx-control-statements/components';
import {
  deleteApplicationPlan,
  getComponentdefinitions,
  getAppliationComponent,
  getApplicationEnvbinding,
  getApplicationComponents,
} from '../../api/application';
import type {
  ApplicationBase,
  ApplicationComponent,
  EnvBinding,
} from '../../interface/application';
import type { Project } from '../../interface/project';

type Props = {
  dispatch: ({}) => {};
  applicationList: ApplicationBase[];
  projects?: Project[];
  deliveryTargets?: [];
  history: any;
};
type State = {
  showAddApplication: boolean;
  componentDefinitions: [];
  isLoading: boolean;
  isEdit: boolean;
  editItem: ApplicationBase;
  editComponents?: ApplicationComponent;
  envbinding: EnvBinding[];
};

@connect((store: any) => {
  return { ...store.application, ...store.deliveryTarget, ...store.clusters };
})
class Application extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showAddApplication: false,
      componentDefinitions: [],
      isLoading: false,
      isEdit: false,
      editItem: {
        name: '',
        alias: '',
        icon: '',
        description: '',
        createTime: '',
        project: { name: '', namespace: '' },
      },
      editComponents: { name: '', type: '', properties: '' },
      envbinding: [],
    };
  }

  componentDidMount() {
    this.getApplications({});
    this.getProjectList();
    this.getDeliveryTarget();
    this.onGetComponentdefinitions();
  }

  loadApplicationEnvbinding = async (appName: string) => {
    if (appName) {
      getApplicationEnvbinding({ appName }).then((res) => {
        if (res) {
          this.setState({
            envbinding: res && res.envBindings,
          });
        }
      });
    }
  };

  loadApplicationComponents = async (appName: string) => {
    getApplicationComponents({ appName, envName: '' }).then((res) => {
      if (res) {
        const componentName = (Array.isArray(res.components) && res.components[0]?.name) || '';
        this.onGetAppliationComponent(appName, componentName);
      }
    });
  };

  onGetAppliationComponent(appName: string, componentName: string) {
    const params = {
      appName,
      componentName,
    };
    getAppliationComponent(params).then((res: any) => {
      if (res) {
        this.setState({
          showAddApplication: true,
          isEdit: true,
          editComponents: res,
        });
      }
    });
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

  getProjectList = async () => {
    this.props.dispatch({
      type: 'application/getProjectList',
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
      isEdit: false,
    });
    this.getApplications({});
  };

  editAppPlan = (editItem: ApplicationBase) => {
    this.loadApplicationEnvbinding(editItem.name);
    this.loadApplicationComponents(editItem.name);
    this.setState({
      editItem,
    });
  };

  render() {
    const { applicationList, projects, deliveryTargets, dispatch } = this.props;
    const { showAddApplication, componentDefinitions, isLoading, envbinding, editComponents } =
      this.state;

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
          projects={projects}
          deliveryTargetList={deliveryTargets}
          dispatch={dispatch}
          getApplications={(params: any) => {
            this.getApplications(params);
          }}
        />

        <Loading visible={isLoading} fullScreen>
          <CardContend
            applications={applicationList}
            editAppPlan={(item) => {
              this.editAppPlan(item);
            }}
            deleteAppPlan={this.onDeleteAppPlan}
          />
        </Loading>

        <If condition={showAddApplication}>
          <AppDialog
            visible={showAddApplication}
            isEdit={this.state.isEdit}
            editItem={this.state.editItem}
            editEnvbinding={envbinding}
            editComponents={editComponents}
            syncProjectList={this.getProjectList}
            projects={projects}
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
