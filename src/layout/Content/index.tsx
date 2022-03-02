import React from 'react';
import { Route, Switch, Redirect } from 'dva/router';
import Application from '../../pages/ApplicationList';
import Clusters from '../../pages/Cluster/index';
import Addons from '../../pages/Addons/index';
import ApplicationWorkflow from '../../pages/ApplicationWorkflow/index';
import ApplicationConfig from '../../pages/ApplicationConfig';
import NotFound from '../../pages/NotFound';
import ApplicationInstanceList from '../../pages/ApplicationInstanceList';
import ApplicationRevisionList from '../../pages/ApplicationRevisionList';
import TargetList from '../../pages/TargetList';
import ApplicationStatus from '../../pages/ApplicationStatus';
import ApplicationLayout from '../Application';
import EnvPage from '../../pages/EnvPage';

export default function Content() {
  return (
    <Switch>
      <Route
        exact
        path="/"
        render={() => {
          return <Redirect to="/applications" />;
        }}
      />
      <Route exact path="/applications" component={Application} />
      <Route
        exact
        path="/applications/:appName"
        render={(props: any) => {
          return <Redirect to={`/applications/${props.match.params.appName}/config`} />;
        }}
      />
      <Route
        exact
        path="/applications/:appName/config"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationConfig {...props} />
            </ApplicationLayout>
          );
        }}
      />
      <Route
        exact
        path="/applications/:appName/workflows"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationWorkflow {...props} />
            </ApplicationLayout>
          );
        }}
      />
      <Route
        exact
        path="/applications/:appName/revisions"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationRevisionList {...props} />
            </ApplicationLayout>
          );
        }}
      />
      <Route
        exact
        path="/applications/:appName/envbinding/:envName"
        render={(props: any) => {
          return (
            <Redirect
              to={`/applications/${props.match.params.appName}/envbinding/${props.match.params.envName}/status`}
            />
          );
        }}
      />
      <Route
        exact
        path="/applications/:appName/envbinding/:envName/instances"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationInstanceList {...props} />
            </ApplicationLayout>
          );
        }}
      />
      <Route
        exact
        path="/applications/:appName/envbinding/:envName/status"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationStatus {...props} />
            </ApplicationLayout>
          );
        }}
      />
      <Route
        exact
        path="/envs"
        render={(props: any) => {
          return <EnvPage {...props} />;
        }}
      />
      <Route path="/targets" component={TargetList} />
      <Route path="/clusters" component={Clusters} />
      <Route path="/addons/:addonName" component={Addons} />
      <Route path="/addons" component={Addons} />
      <Route path="/notFound" component={NotFound} />
      <Redirect to="/notFound" />
    </Switch>
  );
}
