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
import ApplicationLog from '../../pages/ApplicationLog';
import Users from '../../pages/Users';
import ProjectLayout from '../Project';
import Projects from '../../pages/Projects';
import ProjectSummary from '../../pages/ProjectSummary';
import ProjectApplications from '../../pages/ProjectApplications';
import Roles from '../../pages/Roles';
import ProjectRoles from '../../pages/ProjectRoles';
import ProjectMembers from '../../pages/ProjectMembers';

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
        path="/applications/:appName/envbinding/:envName/logs"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationLog {...props} />
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
      <Route path="/users" component={Users} />
      <Route exact path="/projects" component={Projects} />
      <Route
        exact
        path="/projects/:projectName"
        render={(props: any) => {
          return <Redirect to={`/projects/${props.match.params.projectName}/summary`} />;
        }}
      />
      <Route
        exact
        path="/projects/:projectName/summary"
        render={(props: any) => {
          const mergeProps = { ...props, ...{ activeId: 'summary' } };
          return (
            <ProjectLayout {...mergeProps}>
              <ProjectSummary {...mergeProps} />
            </ProjectLayout>
          );
        }}
      />
      <Route
        exact
        path="/projects/:projectName/applications"
        render={(props: any) => {
          const mergeProps = { ...props, ...{ activeId: 'applications' } };
          return (
            <ProjectLayout {...mergeProps}>
              <ProjectApplications {...mergeProps} />
            </ProjectLayout>
          );
        }}
      />
      <Route
        exact
        path="/projects/:projectName/roles"
        render={(props: any) => {
          const mergeProps = { ...props, ...{ activeId: 'roles' } };
          return (
            <ProjectLayout {...mergeProps}>
              <ProjectRoles {...mergeProps} />
            </ProjectLayout>
          );
        }}
      />
      <Route
        exact
        path="/projects/:projectName/members"
        render={(props: any) => {
          const mergeProps = { ...props, ...{ activeId: 'members' } };
          return (
            <ProjectLayout {...mergeProps}>
              <ProjectMembers {...mergeProps} />
            </ProjectLayout>
          );
        }}
      />
      <Route path="/roles" component={Roles} />
      <Route path="/notFound" component={NotFound} />
      <Redirect to="/notFound" />
    </Switch>
  );
}
