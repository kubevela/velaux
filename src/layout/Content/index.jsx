import React from 'react';
import { Router, Route, Switch, Redirect } from 'dva/router';
import Application from '../../pages/Application';
import Clust from '../../pages/Clust/index';
import { Plugins } from '../../pages/Plugins/index';
import Workflow from '../../pages/Workflow/index';
import General from '../../pages/General';

export default function Content() {
  return (
    <Switch>
      <Route path="/applications/:name" component={General} />
      <Route path="/applications" component={Application} />
      <Route path="/clusters" component={Clust} />
      <Route path="/addons" component={Plugins} />
      <Route path="/workflows/:name" component={Workflow} />
      <Redirect from="/" to="/applications" />
    </Switch>
  );
}
