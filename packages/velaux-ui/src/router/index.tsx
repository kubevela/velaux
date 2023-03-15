import React from 'react';
import { Router, Switch, Redirect } from 'dva/router';

import Routes from './routes';
import AuthRoute from '../components/AuthRoute';

interface RouteDefinition {
  path: string;
  name: string;
  component: any;
  auth: boolean;
}

function RouterView(props: any) {
  const routes: RouteDefinition[] = props.routes ? props.routes : Routes;
  const { history } = props;
  const defaultRoute = <Redirect from="/" to="/applications" key={'default'} exact />;
  return (
    <Router history={history}>
      <Switch>
        {routes
          .map((item) => {
            const Comp = item.component;
            return (
              <AuthRoute
                key={item.name}
                path={item.path}
                history={history}
                component={() => {
                  return <Comp history={history} />;
                }}
              />
            );
          })
          .concat([defaultRoute])}
      </Switch>
    </Router>
  );
}

export default RouterView;
