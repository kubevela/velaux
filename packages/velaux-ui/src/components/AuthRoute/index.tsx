import { Route } from 'dva/router';
import React, { Fragment, Component } from 'react';

import CallBackPage from '../../pages/CallBackPage';
import LoginPage from '../../pages/Login';
import { hasToken } from '../../utils/storage';

type Props = {
  component: any;
  path: string;
  history: {
    push: (path: string, state?: any) => void;
    location: {
      pathname: string;
    };
  };
};
export default class AuthRoute extends Component<Props> {
  componentDidMount() {
    this.checkAuth();
  }

  checkAuth = () => {
    if (!hasToken() && window.location.href.indexOf('/callback?code=') == -1) {
      this.props.history.push('/login');
    }
  };

  render() {
    const Components = this.props.component;
    return (
      <Route
        path={this.props.path}
        render={() => {
          if (hasToken()) {
            return <Components />;
          } else {
            return (
              <Fragment>
                <Route
                  exact
                  path="/callback"
                  render={(props: any) => {
                    return <CallBackPage {...props}></CallBackPage>;
                  }}
                />
                <Route
                  exact
                  path="/login"
                  render={(props: any) => {
                    return <LoginPage {...props}></LoginPage>;
                  }}
                />
              </Fragment>
            );
          }
        }}
      />
    );
  }
}
