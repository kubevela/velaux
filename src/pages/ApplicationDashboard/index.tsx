import React, { Component } from 'react';
import { connect } from 'dva';
import { getComponentdefinitions, getApplicationComponents } from '../../api/application';
import { DragDropContext } from 'react-dnd';
import HTMLBackend from 'react-dnd-html5-backend';
import { Grid, Loading, Field } from '@b-design/ui';
import TabsContent from './components/TabsContent/index';
import AddComponent from './components/AddComponent';
import Header from './components/Header';
import BaseInfo from './components/BaseInfo';
import StepWorkFlow from './components/StepWorlFlow';
import './index.less';
import ApplicationLayout from '../../layout/Application';
import { If } from 'tsx-control-statements/components';
import { ApplicationDetail, ApplicationBase } from '../../interface/application';
import Topology from './components/Topology';
import Translation from '../../components/Translation';

type Props = {
  match: {
    params: {
      appName: string;
    };
  };
  componentDefinitions: [];
  applicationDetail: ApplicationDetail;
  applicationList: Array<ApplicationBase>;
  clusterList: [];
  namespaceList: [];
  loading: { global: Boolean };
  history: {
    push: (path: string, state: {}) => {};
  };
  dispatch: ({}) => {};
};

type State = {
  visible: boolean;
  visibleDraw: boolean;
  componentType: string;
  activeKey: string;
  componentDefinitions: [];
  workflowStatus: [];
  components: [];
  appPlanName: string;
  isLoading: boolean;
  visibleEnvPlan: boolean;
};
@DragDropContext(HTMLBackend)
@connect((store: any) => {
  return { ...store.application, ...store.clusters, loading: store.loading };
})
class Dashboard extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      visible: false,
      visibleDraw: false,
      componentType: '',
      activeKey: 'basisConfig',
      componentDefinitions: [],
      workflowStatus: [],
      components: [],
      appPlanName: '',
      isLoading: false,
      visibleEnvPlan: false,
    };
  }

  componentDidMount() {
    this.onGetApplicationComponents();
    this.onGetComponentdefinitions();
  }

  onGetComponentdefinitions = async () => {
    getComponentdefinitions({}).then((res) => {
      if (res) {
        this.setState({
          componentDefinitions: res && res.definitions,
        });
      }
    });
  };

  onGetApplicationComponents = async () => {
    const {
      params: { appName },
    } = this.props.match;
    const { activeKey } = this.state;
    const envName = activeKey === 'basisConfig' ? '' : activeKey;
    const params = {
      appName: appName,
      envName: envName,
    };
    this.setState({ isLoading: true, appPlanName: appName });
    getApplicationComponents(params)
      .then((res) => {
        if (res) {
          this.setState({
            components: res && res.componentplans,
          });
        }
        this.setState({ isLoading: false });
      })
      .catch((err) => {
        this.setState({ isLoading: false });
      });
  };

  setVisible = (visible: boolean) => {
    this.setState({ visible });
  };

  openAddComponent = (componentType: string) => {
    this.setState({
      visibleDraw: true,
      componentType,
    });
  };

  closeAddComponent = () => {
    this.setState({
      visibleDraw: false,
    });
  };

  changeActiveKey = (activeKey: string | number) => {
    const key = '' + activeKey;
    this.setState(
      {
        activeKey: key,
      },
      () => {
        this.onGetApplicationComponents();
      },
    );
  };

  changeAppName = (name: string) => {
    this.props.history.push(`/applications/${name}`, {});
  };

  render() {
    const {
      visible,
      componentType,
      activeKey,
      componentDefinitions = [],
      workflowStatus = [],
      components = [],
      isLoading,
      appPlanName,
    } = this.state;
    const {
      params: { appName },
    } = this.props.match;
    if (appName != appPlanName) {
      this.onGetApplicationComponents();
    }
    const { Row, Col } = Grid;
    const { history, dispatch, applicationDetail, applicationList, clusterList, namespaceList } =
      this.props;
    const { policies, envBinding = [] } = applicationDetail;

    return (
      <ApplicationLayout {...this.props}>
        <div className="dashboard">
          <Header
            appName={appName}
            history={history}
            applicationList={applicationList}
            changeAppName={(name) => {
              this.changeAppName(name);
            }}
            setVisible={(visible) => {
              this.setVisible(visible);
            }}
          />

          <Row className="card-content-wraper margin-top-10">
            <Col span="12">
              <BaseInfo detail={applicationDetail} policies={policies} />
            </Col>
            <Col span="12">
              <StepWorkFlow appName={appName} history={history} workflowStatus={workflowStatus} />
            </Col>
          </Row>
          <Loading tip="loading..." visible={isLoading} style={{ width: '100%' }}>
            <Row className="tabs-wraper">
              <Col span={20}>
                <TabsContent
                  activeKey={activeKey}
                  envBind={envBinding}
                  changeActiveKey={this.changeActiveKey}
                />
              </Col>
              <Col span={4}>
                <div className="action-list">
                  <a
                    onClick={() => {
                      this.setState({ visibleEnvPlan: true });
                    }}
                  >
                    <Translation>Add Environment</Translation>
                  </a>
                </div>
              </Col>
            </Row>

            <Row className="topology">
              <Col span={24}>
                <Topology
                  appPlanDetail={applicationDetail}
                  showBox={activeKey === 'basisConfig'}
                  components={components}
                  onAddComponent={this.openAddComponent}
                ></Topology>
              </Col>
            </Row>
          </Loading>
          <If condition={this.state.visibleDraw}>
            <AddComponent
              appName={appName}
              envBinding={envBinding}
              components={components}
              componentType={componentType}
              componentDefinitions={componentDefinitions}
              onOK={() => {
                this.onGetApplicationComponents();
                this.closeAddComponent();
              }}
              onClose={this.closeAddComponent}
            />
          </If>
        </div>
      </ApplicationLayout>
    );
  }
}

export default Dashboard;
