import { Loading } from '@b-design/ui';
import React, { Component } from 'react';

class ApplicationPlanLayout extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    this.onGetApplicationDetails();
    this.getApplicationPlanList();
    this.getClusterList();
    this.getNamespaceList();
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.match.params.appName !== prevProps.match.params.appName) {
      this.onGetApplicationDetails();
    }
  }

  onGetApplicationDetails = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.setState({ activeName: appName });
    this.props.dispatch({
      type: 'application/getApplicationPlanDetail',
      payload: { appPlanName: appName },
      callback: () => {
        this.setState({ loading: false });
      },
    });
  };

  getApplicationPlanList = async () => {
    this.props.dispatch({
      type: 'application/getApplicationPlanList',
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
      params: { appName },
    } = this.props.match;
    const loadingDom = <Loading style={{ width: '100%', minHeight: '200px' }}></Loading>;
    if (appName != activeName) {
      this.onGetApplicationDetails();
      return loadingDom;
    }
    if (loading) {
      return loadingDom;
    }
    return <div className="appplan">{children}</div>;
  }
}

export default ApplicationPlanLayout;
