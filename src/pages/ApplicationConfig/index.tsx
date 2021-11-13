import React, { Component } from 'react';
import { Grid, Button, Card } from '@b-design/ui';
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
class ApplicationConfig extends Component<Props, State> {
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
    return <div></div>;
  }
}

export default ApplicationConfig;
