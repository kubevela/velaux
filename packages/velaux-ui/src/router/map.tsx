import { Router, Switch, Redirect } from 'dva/router';
import React, { Component } from 'react';
import * as history from 'history';

import AuthRoute from '../components/AuthRoute';

type RouteConfig = { children: []; component: any; name: string; path: string };
type Props = {
  routes: RouteConfig[];
  history: history.History;
};

class RouterMap extends Component<Props, {}> {
  render() {
    const { routes, history } = this.props;
    const defaultRoute = <Redirect from="/" to="/applications" key={'default'} exact />;
    return (
      <Router history={history}>
        <Switch>
          {routes
            .map((item) => {
              const children = item.children === undefined ? [] : item.children;
              const Comp = item.component;
              return (
                <AuthRoute
                  key={item.name}
                  path={item.path}
                  history={history}
                  component={() => {
                    return <Comp routes={children} history={history} />;
                  }}
                />
              );
            })
            .concat([defaultRoute])}
        </Switch>
      </Router>
    );
  }
}

export default RouterMap;
