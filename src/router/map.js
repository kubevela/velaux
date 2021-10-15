import React, { Component } from 'react';
import PropType from 'prop-types'
import { Router, Route, Switch, Redirect } from 'dva/router';

class RouterMap extends Component {
  render() {
    const { routes, history } = this.props;
    const defaultRoute = <Redirect from='/' to='/application' key={'default'} exact ></Redirect>;
    return <Router history={history}>
      <Switch>
        {
          routes.map((item, index) => {
            const children = item.children === undefined ? [] : item.children;
            const Comp = item.component;
            return <Route key={item.name} path={item.path} component={() => {
              return <Comp routes={children} history={history}></Comp>
            }} />
          }).concat([defaultRoute])
        }

      </Switch>
    </Router>
  }
}

RouterMap.propTypes = {
  routes: PropType.array,
  history: PropType.object
}
export default RouterMap;
