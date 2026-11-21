import { Loading } from '@alifd/next';
import { allProjects, askedProject } from '../../utils/currentProject';
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
  currentProject?: { current: string; resolved: boolean };
}
@connect((store: any) => {
  return { ...store.application, currentProject: store.currentProject };
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

  // The layout re-renders when the URL moves, its query included: a tab's +
  // asks its page for the add dialog with ?add=1 on the same path.
  shouldComponentUpdate(nextProps: any) {
    return (
      nextProps.location.pathname !== this.props.location.pathname ||
      nextProps.location.search !== this.props.location.search
    );
  }

  // followProject moves the picked project to the application's own, so a link
  // into another project's application lands in that project.
  followProject = () => {
    const { currentProject, applicationDetail, dispatch } = this.props;
    const project = applicationDetail?.project?.name;
    // Before the picker has settled, the project is the one it is about to pick.
    const current = currentProject?.resolved ? currentProject.current : askedProject();
    if (project && current !== allProjects && project !== current) {
      dispatch({ type: 'currentProject/setProject', payload: project });
    }
  };

  onGetApplicationDetails = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.setState({ activeName: appName, loading: true });
    this.props.dispatch({
      type: 'application/getApplicationDetail',
      payload: { appName: appName },
      callback: () => {
        this.followProject();
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
