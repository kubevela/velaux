import React from 'react';
import { Router, Route, Switch, Redirect } from 'dva/router';
import Application from '../../pages/Application';
import Clust from '../../pages/Clust/index';
import { Plugins } from '../../pages/Plugins/index';
import Workflow from '../../pages/Workflow/index';
import General from '../../pages/General';
import ComponentDetails from '../../pages/ComponentDetails';
import NotFound from '../../pages/NotFound';

export default function Content() {
  return (
    <Switch>
      <Route exact path="/applications/:name" component={General} />
      <Route exact path="/applications" component={Application} />
      <Route exact path="/applications/:name/:componentName" component={ComponentDetails} />
      <Route exact path="/" component={Application} />
      <Route path="/clusters" component={Clust} />
      <Route path="/addons" component={Plugins} />
      <Route path="/workflows/:name" component={Workflow} />
      <Route path="/notFound" component={NotFound} />
      <Redirect to="/notFound" />
    </Switch>
  );
}
