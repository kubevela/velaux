import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
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
  dispatch: ({}) => {};
};

type State = {
  appName: string;
  visible: boolean;
  visibleDraw: boolean;
  componentType: string;
  activeKey: string;
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
    };
  }

  componentDidMount() {
    this.getApplication();
    this.getApplicationDetails();
    this.getComponentdefinitions();
  }

  getApplication = async () => {
    this.props.dispatch({
      type: 'application/getApplicationList',
      payload: {},
    });
  };

  getApplicationDetails = async () => {
    const { appName } = this.state;
    this.props.dispatch({
      type: 'application/getApplicationDetails',
      payload: {
        urlParam: appName,
      },
    });
  };

  getPolicies() {
    const { appName } = this.state;
    this.props.dispatch({
      type: 'application/getPolicies',
      payload: {
        urlParam: appName,
      },
    });
  }
  getComponentdefinitions() {
    this.props.dispatch({
      type: 'application/getComponentdefinitions',
      payload: {
        urlParam: '',
      },
    });
  }

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
        this.getApplicationDetails();
        this.getComponentdefinitions();
        this.getComponents();
      },
    );
  };

  render() {
    const { appName, visible, componentType, activeKey } = this.state;
    const { Row, Col } = Grid;
    const {
      applicationList = [],
      applicationDetail = {},
      componentDefinitions = [],
      workflowStatus = [],
      components = [],
      loading,
      history,
      dispatch,
    } = this.props;
    const { status, policies, envBind = [] } = applicationDetail;
    const isLoading = loading.global === true ? true : false;

    return (
      <div className="general">
        <Title
          appName={appName}
          history={history}
          applicationList={applicationList}
          getApplicationDetails={this.getApplicationDetails}
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
