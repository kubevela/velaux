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
    };
  }

  componentDidMount() {
    this.onGetApplicationDetails();
    this.getApplicationList();
    this.getClusterList();
    this.getNamespaceList();
  }

  onGetApplicationDetails = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.setState({ activeName: appName, loading: true });
    this.props.dispatch({
      type: 'application/getApplicationDetail',
      payload: { appPlanName: appName },
      callback: () => {
        this.setState({ loading: false }, () => {});
      },
    });
  };

  getApplicationList = async () => {
    this.props.dispatch({
      type: 'application/getApplicationList',
    });
  };

  getClusterList = async () => {
    this.props.dispatch({
      type: 'clusters/getClusterList',
    });
  };

  getNamespaceList = async () => {
    this.props.dispatch({
      type: 'application/getNamespaceList',
      payload: {},
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
    if (appName != activeName) {
      this.onGetApplicationDetails();
      return loadingDom;
    }
    if (loading) {
      return loadingDom;
    }
    return (
      <div className="applayout">
        <Header></Header>
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
