import React from 'react';
import { Route, Switch, Redirect } from 'dva/router';
import Application from '../../pages/ApplicationList';
import Clusters from '../../pages/Cluster/index';
import Addons from '../../pages/Addons/index';
import ApplicationWorkflow from '../../pages/ApplicationWorkflow/index';
import ApplicationBasic from '../../pages/ApplicationBasic';
import NotFound from '../../pages/NotFound';
import ApplicationInstanceList from '../../pages/ApplicationInstanceList';
import ApplicationRevisionList from '../../pages/ApplicationRevisionList';
import DeliveryTargetList from '../../pages/DeliveryTargetList';

export default function Content() {
  return (
    <Switch>
      <Route
        exact
        path="/"
        render={() => {
          return <Redirect to="/applications"></Redirect>;
        }}
      />
      <Route exact path="/applications" component={Application} />
      <Route
        exact
        path="/applications/:appName"
        render={(props: any) => {
          return <Redirect to={`/applications/${props.match.params.appName}/basic`}></Redirect>;
        }}
      />
      <Route exact path="/applications/:appName/basic" component={ApplicationBasic} />
      <Route exact path="/applications/:appName/workflows" component={ApplicationWorkflow} />
      <Route exact path="/applications/:appName/revisions" component={ApplicationRevisionList} />
      <Route
        exact
        path="/applications/:appName/envbinding/:envName/instances"
        component={ApplicationInstanceList}
      />
      <Route path="/deliveryTargets" component={DeliveryTargetList} />
      <Route path="/clusters" component={Clusters} />
      <Route path="/addons" component={Addons} />
      <Route path="/notFound" component={NotFound} />
      <Redirect to="/notFound" />
    </Switch>
  );
}
