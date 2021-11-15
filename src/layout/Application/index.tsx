import { Loading, Grid } from '@b-design/ui';
import React, { Component } from 'react';
import { connect } from 'dva';
import Header from './components/Header';
import EnvTabs from './components/EnvTabs';
import Menus from './components/Menus';
import './index.less';

const { Row, Col } = Grid;

interface Props {
  match: any;
  dispatch: any;
}
@connect((store: any) => {
  return { ...store.application };
})
class ApplicationLayout extends Component<Props, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: false,
      activeName: '',
    };
  }

  componentDidMount() {
    this.onGetApplicationDetails();
    this.getApplicationList();
    this.getNamespaceList();
  }

  onGetApplicationDetails = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.setState({ activeName: appName, loading: true });
    this.props.dispatch({
      type: 'application/getApplicationDetail',
      payload: { appName: appName },
      callback: () => {
        this.setState({ loading: false }, () => {
          this.loadApplicationStatus();
          this.loadApplicationComponents();
        });
      },
    });
  };

  getApplicationList = async () => {
    this.props.dispatch({
      type: 'application/getApplicationList',
    });
  };

  getNamespaceList = async () => {
    this.props.dispatch({
      type: 'application/getNamespaceList',
      payload: {},
    });
  };

  loadApplicationStatus = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationStatus',
      payload: { appName: appName },
    });
  };

  loadApplicationComponents = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationComponents',
      payload: { appName: appName },
    });
  };

  render() {
    const { loading, activeName } = this.state;
    const { children } = this.props;
    const {
      path,
      params: { appName, envName },
    } = this.props.match;
    const loadingDom = <Loading style={{ width: '100%', minHeight: '200px' }}></Loading>;
    if (activeName !== '' && appName != activeName) {
      this.onGetApplicationDetails();
      return loadingDom;
    }
    if (loading) {
      return loadingDom;
    }
    return (
      <div className="applayout">
        <Header currentPath={path}></Header>
        <EnvTabs activeKey={envName ? envName : 'basisConfig'}></EnvTabs>
        <Row className="padding16 main">
          <div className="menu">
            <Menus currentPath={path} appName={appName} envName={envName}></Menus>
          </div>
          <div className="content">{children}</div>
        </Row>
      </div>
    );
  }
}

export default ApplicationLayout;
