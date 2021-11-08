import React, { Component } from 'react';
import { connect } from 'dva';
import { getComponentdefinitions, getApplicationComponents } from '../../api/application';
import { DragDropContext } from 'react-dnd';
import HTMLBackend from 'react-dnd-html5-backend';
import { Grid, Loading, Field } from '@b-design/ui';
import { NEW_COMPONENTS } from './constants';
import TabsContent from './components/TabsContent/index';
import PublishDialog from './components/PublishDialog';
import AddComponent from './components/AddComponent';
import Header from './components/Header';
import BaseInfo from './components/BaseInfo';
import StepWorkFlow from './components/StepWorlFlow';
import './index.less';
import ApplicationPlanLayout from '../../layout/ApplicationPlan';
import { If } from 'tsx-control-statements/components';
import { AppPlanDetail, AppPlanBase } from '../../interface/applicationplan';
import Topology from './components/Topology';
import DrawerWithFooter from '../../components/Drawer';
import Translation from '../../components/Translation';
import AddEnvBind from './components/AddEnvBind';

type Props = {
  match: {
    params: {
      appName: string;
    };
  };
  componentDefinitions: [];
  applicationPlanDetail: AppPlanDetail;
  applicationPlanList: Array<AppPlanBase>;
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
  isLoading: boolean;
  visibleEnvPlan: boolean;
};
@DragDropContext(HTMLBackend)
@connect((store: any) => {
  return { ...store.application, loading: store.loading };
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
      name: appName,
      envName: envName,
    };
    this.setState({ isLoading: true });
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

  changeActiveKey = (activeKey: string) => {
    this.setState(
      {
        activeKey: activeKey,
      },
      () => {
        this.onGetApplicationComponents();
      },
    );
  };

  changeAppName = (name: string) => {
    this.props.history.push(`/applicationplans/${name}`, {});
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
    } = this.state;
    const {
      params: { appName },
    } = this.props.match;
    const { Row, Col } = Grid;
    const { history, dispatch, applicationPlanDetail, applicationPlanList } = this.props;
    const { status, policies, envBind = [] } = applicationPlanDetail;
    return (
      <ApplicationPlanLayout {...this.props}>
        <div className="dashboard">
          <Header
            appName={appName}
            history={history}
            applicationPlanList={applicationPlanList}
            changeAppName={(name) => {
              this.changeAppName(name);
            }}
            setVisible={(visible) => {
              this.setVisible(visible);
            }}
          />

          <Row className="card-content-wraper margin-top-10">
            <Col span="12">
              <BaseInfo detail={applicationPlanDetail} policies={policies} />
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
                  envBind={envBind}
                  history={history}
                  changeActiveKey={(activeKey: string) => {
                    this.changeActiveKey(activeKey);
                  }}
                  dispatch={dispatch}
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
                  appPlanDetail={applicationPlanDetail}
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
              envBind={envBind}
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

          <If condition={this.state.visibleEnvPlan}>
            <AddEnvBind
              appPlanBase={applicationPlanDetail}
              onClose={() => {
                this.setState({ visibleEnvPlan: false });
              }}
              onOK={() => {
                this.setState({ visibleEnvPlan: false });
              }}
            ></AddEnvBind>
          </If>

          <PublishDialog
            appName={appName}
            visible={visible}
            setVisible={(visible) => {
              this.setVisible(visible);
            }}
            dispatch={dispatch}
          />
        </div>
      </ApplicationPlanLayout>
    );
  }
}

export default Dashboard;
