import React, { Fragment, Component } from 'react';
import { hasToken } from '../../utils/storage';
import { Route } from 'dva/router';
import LoginPage from '../../pages/Login';
import CallBackPage from '../../pages/CallBackPage';

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
                <Route exact path="/callback" component={CallBackPage} />
                <Route exact path="/login" component={LoginPage} />
              </Fragment>
            );
          }
        }}
      />
    );
  }
}
