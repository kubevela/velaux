import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import {
  getApplicationList,
  getApplicationDetails,
  getComponentdefinitions,
  getApplicationComponents,
} from '../../api/application';
import { DragDropContext } from 'react-dnd';
import HTMLBackend from 'react-dnd-html5-backend';
import { Breadcrumb, Select, Grid, Button, Card, Step, Drawer, Affix, Loading } from '@b-design/ui';
import { NEW_COMPONENTS } from './constants';
import { If } from 'tsx-control-statements/components';
import TabsContent from './components/TabsContent/index';
import ComponentsGroup from './components/ComponentsGroup';
import PublishDialog from './components/PublishDialog';
import AddComponent from './components/AddComponent';
import Title from './components/Title';
import Policies from './components/Policies';
import StepWorkFlow from './components/StepWorlFlow';
import { addBasicConfigField, getAppCardList } from '../../model/application';
import './index.less';

type Props = {
  match: {
    params: {
      appName: string;
    };
  };
  applicationList: [];
  applicationDetail: any;
  componentDefinitions: [];
  workflowStatus: [];
  components: [];
  loading: { global: Boolean };
  history: {
    push: (path: string, state: {}) => {};
  };
  dispatch: ({ }) => {};
};

type State = {
  appName: string;
  visible: boolean;
  visibleDraw: boolean;
  componentType: string;
  activeKey: string;
  applicationList: any;
  applicationDetail: any;
  componentDefinitions: [];
  workflowStatus: [];
  components: [];
  isLoading: boolean;
};
@DragDropContext(HTMLBackend)
@connect((store: any) => {
  return { ...store.application, loading: store.loading };
})
class General extends Component<Props, State> {
  tabsRef: React.RefObject<TabsContent>;
  constructor(props: Props) {
    super(props);
    const { params } = this.props.match;
    this.tabsRef = React.createRef();
    this.state = {
      appName: params.appName,
      visible: false,
      visibleDraw: false,
      componentType: '',
      activeKey: 'basisConfig',
      applicationList: [],
      applicationDetail: [],
      componentDefinitions: [],
      workflowStatus: [],
      components: [],
      isLoading: false,
    };
  }

  componentDidMount() {
    this.onGetApplication();
    this.onGetApplicationDetails();
    this.onGetApplicationComponents();
    this.onGetComponentdefinitions();
  }

  onGetApplication = async () => {
    getApplicationList({}).then((res) => {
      if (res) {
        this.setState({
          applicationList: getAppCardList(res || {}),
        });
      }
    });
  };

  onGetApplicationDetails = async () => {
    const { appName } = this.state;
    this.setState({ isLoading: true });
    getApplicationDetails({ name: appName })
      .then((res) => {
        if (res) {
          this.setState({
            applicationDetail: addBasicConfigField(res),
          });
        }
        this.setState({ isLoading: false });
      })
      .catch((err) => {
        this.setState({ isLoading: false });
      });
  };

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
    const { appName, activeKey } = this.state;
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

  onOpen = (componentType: string) => {
    this.setState({
      visibleDraw: true,
      componentType,
    });
  };

  onClose = () => {
    this.setState({
      visibleDraw: false,
    });
  };

  //when compoent create success, callback
  getComponents = () => {
    const tabsRef: any = this.tabsRef.current;
    const tabsContent = tabsRef.decoratedRef.current;
    tabsContent.getApplicationComponents();
  };

  changeActiveKey = (activeKey: string) => {
    this.setState({
      activeKey: activeKey,
    });
  };

  changeAppName = (name: string) => {
    this.setState(
      {
        appName: name,
      },
      () => {
        this.props.history.push(`/applicationplans/${name}`, {});
        this.onGetApplication();
        this.onGetApplicationDetails();
        this.onGetApplicationComponents();
        this.onGetComponentdefinitions();
      },
    );
  };

  render() {
    const {
      appName,
      visible,
      componentType,
      activeKey,
      applicationList = [],
      applicationDetail = {},
      componentDefinitions = [],
      workflowStatus = [],
      components = [],
      isLoading,
    } = this.state;
    const { Row, Col } = Grid;
    const { history, dispatch } = this.props;
    const { status, policies, envBind = [] } = applicationDetail;
    return (
      <div className="general">
        <Title
          appName={appName}
          history={history}
          applicationList={applicationList}
          getApplicationDetails={this.onGetApplicationDetails}
          changeAppName={(name) => {
            this.changeAppName(name);
          }}
          setVisible={(visible) => {
            this.setVisible(visible);
          }}
        />

        <Row className="card-content-wraper margin-top-10">
          <Col span="12">
            <Policies appName={appName} status={status} policies={policies} />
          </Col>
          <Col span="12">
            <StepWorkFlow appName={appName} history={history} workflowStatus={workflowStatus} />
          </Col>
        </Row>
        <Loading tip="loading..." fullScreen visible={isLoading}>
          <Row className="tabs-wraper">
            <TabsContent
              activeKey={activeKey}
              envBind={envBind}
              appName={appName}
              components={components}
              history={history}
              changeActiveKey={(activeKey: string) => {
                this.changeActiveKey(activeKey);
              }}
              getApplicationComponents={this.onGetApplicationComponents}
              dispatch={dispatch}
              ref={this.tabsRef}
            />
          </Row>

          <Row className="components-wraper">
            <If condition={activeKey === 'basisConfig'}>
              <Affix>
                {(componentDefinitions || []).map((item: { name: string; description: string }) => (
                  <ComponentsGroup
                    name={item.name}
                    description={item.description}
                    open={(componentType: string) => {
                      this.onOpen(componentType);
                    }}
                  />
                ))}
              </Affix>
            </If>
          </Row>
        </Loading>

        <Drawer
          title={NEW_COMPONENTS}
          placement="right"
          visible={this.state.visibleDraw}
          onClose={this.onClose}
        >
          <AddComponent
            appName={appName}
            envBind={envBind}
            components={components}
            componentType={componentType}
            componentDefinitions={componentDefinitions}
            getComponents={this.getComponents}
            onClose={this.onClose}
          />
        </Drawer>

        <PublishDialog
          appName={appName}
          visible={visible}
          setVisible={(visible) => {
            this.setVisible(visible);
          }}
          dispatch={dispatch}
        />
      </div>
    );
  }
}

export default General;
