import { Loading } from '@alifd/next';
import { connect } from 'dva';
import React, { Component } from 'react';
import { AppTabs, EnvironmentBar } from './components/AppTabs';
import Header from './components/Header';

import './index.less';
import type { ApplicationDetail } from '@velaux/data';
import { Dispatch } from 'redux';

interface Props {
  match: any;
  dispatch: Dispatch;
  location: any;
  applicationDetail?: ApplicationDetail;
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
    this.getNamespaceList();
  }

  shouldComponentUpdate(nextProps: any) {
    return nextProps.location.pathname !== this.props.location.pathname;
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
          this.loadApplicationComponents();
          this.loadApplicationEnvbinding();
          this.loadApplicationWorkflows();
          this.loadApplicationPolicies();
          this.loadApplicationStatus();
        });
      },
    });
  };

  getNamespaceList = async () => {
    this.props.dispatch({
      type: 'application/getNamespaceList',
      payload: {},
    });
  };

  loadApplicationEnvbinding = async () => {
    const {
      params: { appName },
    } = this.props.match;
    if (appName) {
      this.props.dispatch({
        type: 'application/getApplicationEnvbinding',
        payload: { appName: appName },
      });
    }
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

  loadApplicationPolicies = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationPolicies',
      payload: { appName: appName },
    });
  };

  loadApplicationWorkflows = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationWorkflows',
      payload: { appName: appName },
    });
  };

  loadApplicationStatus = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationAllStatus',
      payload: { appName: appName },
    });
  };

  render() {
    const { activeName } = this.state;
    const { children, dispatch, applicationDetail } = this.props;
    const {
      url,
      params: { appName, envName },
    } = this.props.match;
    const loadingDom = <Loading style={{ width: '100%', minHeight: '200px' }} />;
    if (activeName !== '' && appName != activeName) {
      this.onGetApplicationDetails();
      return loadingDom;
    }
    if (!applicationDetail) {
      return loadingDom;
    }
    return (
      <div className="app-layout">
        <Header dispatch={dispatch} appName={appName} envName={envName} currentPath={url} />
        <AppTabs appName={appName} currentPath={url} />
        {envName && <EnvironmentBar appName={appName} envName={envName} currentPath={url} />}
        <div className="app-content">{children}</div>
      </div>
    );
  }
}

export default ApplicationLayout;
