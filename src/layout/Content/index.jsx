import React from 'react';
import { Router, Route, Switch, Redirect } from 'dva/router';
import Application from '../../pages/Application';
import Clusters from '../../pages/Cluster/index';
import Addons from '../../pages/Plugins/index';
import Workflow from '../../pages/Workflow/index';
import General from '../../pages/General';
import ComponentDetails from '../../pages/ComponentDetails';
import NotFound from '../../pages/NotFound';

export default function Content() {
  return (
    <Switch>
      <Route exact path="/applications/:appName" component={General} />
      <Route exact path="/applications" component={Application} />
      <Route
        exact
        path="/applications/:appName/components/:componentName"
        component={ComponentDetails}
      />
      <Route exact path="/" component={Application} />
      <Route path="/clusters" component={Clusters} />
      <Route path="/addons" component={Addons} />
      <Route path="/workflows/:workflowName" component={Workflow} />
      <Route path="/notFound" component={NotFound} />
      <Redirect to="/notFound" />
    </Switch>
  );
}
