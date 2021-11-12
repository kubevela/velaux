import React, { Component } from 'react';
import PropType from 'prop-types';
import { Router, Route, Switch, Redirect } from 'dva/router';

type Props = {
  routes: Array<{ children: []; component: any; name: string; path: string }>;
  history: any;
};

class RouterMap extends Component<Props, {}> {
  render() {
    const { routes, history } = this.props;
    const defaultRoute = <Redirect from="/" to="/applications" key={'default'} exact></Redirect>;
    return (
      <Router history={history}>
        <Switch>
          {routes
            .map((item) => {
              const children = item.children === undefined ? [] : item.children;
              const Comp = item.component;
              return (
                <Route
                  key={item.name}
                  path={item.path}
                  component={() => {
                    return <Comp routes={children} history={history}></Comp>;
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
