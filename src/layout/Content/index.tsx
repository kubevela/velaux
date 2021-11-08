import React from 'react';
import { Route, Switch, Redirect } from 'dva/router';
import Application from '../../pages/ApplicationPlanList';
import Clusters from '../../pages/Cluster/index';
import Addons from '../../pages/Addons/index';
import Workflow from '../../pages/WorkflowPlan/index';
import ApplicationPlanDashboard from '../../pages/ApplicationPlanDashboard';
import ComponentDetails from '../../pages/ComponentDetails';
import NotFound from '../../pages/NotFound';

export default function Content() {
  return (
    <Switch>
      <Route
        exact
        path="/"
        render={() => {
          return <Redirect to="/applicationplans"></Redirect>;
        }}
      />
      <Route exact path="/applicationplans" component={Application} />
      <Route exact path="/applicationplans/:appName" component={ApplicationPlanDashboard} />
      <Route
        exact
        path="/applicationplans/:appName/componentplans/:componentName"
        component={ComponentDetails}
      />
      <Route path="/clusters" component={Clusters} />
      <Route path="/addons" component={Addons} />
      <Route path="/workflowplans/:workflowName" component={Workflow} />
      <Route path="/notFound" component={NotFound} />
      <Redirect to="/notFound" />
    </Switch>
  );
}
