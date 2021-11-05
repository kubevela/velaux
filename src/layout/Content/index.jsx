import React from 'react';
import { Router, Route, Switch, Redirect } from 'dva/router';
import Application from '../../pages/ApplicationPlan';
import Clusters from '../../pages/Cluster/index';
import Addons from '../../pages/Addons/index';
import Workflow from '../../pages/WorkflowPlan/index';
import General from '../../pages/General';
import ComponentDetails from '../../pages/ComponentDetails';
import NotFound from '../../pages/NotFound';

export default function Content() {
  return (
    <Switch>
      <Route exact path="/applicationplans/:appName" component={General} />
      <Route exact path="/applicationplans" component={Application} />
      <Route
        exact
        path="/applicationplans/:appName/components/:componentName"
        component={ComponentDetails}
      />
      <Route exact path="/" component={Application} />
      <Route path="/clusters" component={Clusters} />
      <Route path="/addons" component={Addons} />
      <Route path="/workflowplans/:workflowName" component={Workflow} />
      <Route path="/notFound" component={NotFound} />
      <Redirect to="/notFound" />
    </Switch>
  );
}
