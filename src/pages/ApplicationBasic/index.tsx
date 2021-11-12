import React, { Component } from 'react';
import { Link } from 'dva/router';
import { Breadcrumb, Select, Grid, Button, Card, Step } from '@b-design/ui';
import ApplicationLayout from '../../layout/Application';
import './index.less';
import { connect } from 'dva';

type Props = {
  match: {
    params: {
      appName: string;
      componentName: string;
    };
  };
  history: {
    push: (path: string, state: {}) => {};
  };
  dispatch: ({}) => {};
};

type State = {
  appName: string;
  componentName: string;
};
@connect((store: any) => {
  return { ...store.application };
})
class ApplicationBasic extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { params } = this.props.match;
    this.state = {
      appName: params.appName,
      componentName: params.componentName,
    };
  }
  componentDidMount() {}

  render() {
    return <ApplicationLayout {...this.props}></ApplicationLayout>;
  }
}

export default ApplicationBasic;
