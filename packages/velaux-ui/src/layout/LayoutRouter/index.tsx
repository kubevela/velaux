import { Redirect, Route, Switch } from 'dva/router';
import React from 'react';

import Addons from '../../pages/Addons/index';
import ApplicationConfig from '../../pages/ApplicationConfig';
import ApplicationEnvRoute from '../../pages/ApplicationEnvRoute';
import ApplicationInstanceList from '../../pages/ApplicationInstanceList';
import Application from '../../pages/ApplicationList';
import ApplicationLog from '../../pages/ApplicationLog';
import ApplicationRevisionList from '../../pages/ApplicationRevisionList';
import ApplicationStatus from '../../pages/ApplicationStatus';
import ApplicationWorkflowList from '../../pages/ApplicationWorkflowList';
import ApplicationWorkflowStatus from '../../pages/ApplicationWorkflowStatus/index';
import ApplicationWorkflowStudio from '../../pages/ApplicationWorkflowStudio';
import Clusters from '../../pages/Cluster/index';
import Configs from '../../pages/Configs';
import Definitions from '../../pages/Definitions';
import EnvPage from '../../pages/EnvPage';
import NotFound from '../../pages/NotFound';
import PipelineListPage from '../../pages/PipelineListPage';
import PipelineRunPage from '../../pages/PipelineRunPage';
import PipelineStudio from '../../pages/PipelineStudio';
import ProjectApplications from '../../pages/ProjectApplications';
import ProjectMembers from '../../pages/ProjectMembers';
import ProjectPipelines from '../../pages/ProjectPipelines';
import ProjectRoles from '../../pages/ProjectRoles';
import ProjectSummary from '../../pages/ProjectSummary';
import Projects from '../../pages/Projects';
import Roles from '../../pages/Roles';
import TargetList from '../../pages/TargetList';
import UiSchema from '../../pages/UiSchema';
import Users from '../../pages/Users';
import ApplicationLayout from '../Application';
import ConfigsLayout from '../Configs';
import DefinitionDetails from '../DefinitionDetails';
import DefinitionsLayout from '../Definitions';
import ProjectLayout from '../Project';
import MyProjectList from '../../pages/MyProjectList';
import PlatformSetting from '../../pages/PlatformSetting';
import { AppConfigPage, AppRootPage } from '../AppRootPage';

export default function Router() {
  return (
    <Switch>
      <Route
        exact
        path="/"
        render={() => {
          return <Redirect to="/applications" />;
        }}
      />
      <Route
        exact
        path="/projects"
        render={(props: any) => {
          return <MyProjectList {...props} />;
        }}
      />
      <Route
        exact
        path="/applications"
        render={(props: any) => {
          return <Application {...props} />;
        }}
      />
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
        path="/applications/:appName/envbinding"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationEnvRoute {...props} />;
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
              <ApplicationWorkflowList {...props} />
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
        path="/applications/:appName/envbinding/:envName/workflow"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationWorkflowStatus {...props} />
            </ApplicationLayout>
          );
        }}
      />
      <Route
        exact
        path="/applications/:appName/envbinding/:envName/workflow/records/:record"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationWorkflowStatus {...props} />
            </ApplicationLayout>
          );
        }}
      />
      <Route
        exact
        path="/applications/:appName/envbinding/:envName/workflow/:workflowName/studio"
        render={(props: any) => {
          return (
            <ApplicationLayout {...props}>
              <ApplicationWorkflowStudio {...props} />
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
      <Route
        exact
        path="/pipelines"
        render={(props: any) => {
          return <PipelineListPage {...props} />;
        }}
      />
      <Route
        exact
        path="/projects/:projectName/pipelines/:pipelineName/runs/:runName"
        render={(props: any) => {
          return <PipelineRunPage {...props} />;
        }}
      />
      <Route
        exact
        path="/projects/:projectName/pipelines/:pipelineName/studio"
        render={(props: any) => {
          return <PipelineStudio {...props} />;
        }}
      />
      <Route
        path="/targets"
        render={(props: any) => {
          return <TargetList {...props} />;
        }}
      />
      <Route
        path="/clusters"
        render={(props: any) => {
          return <Clusters {...props} />;
        }}
      />
      <Route
        path="/addons/:addonName"
        render={(props: any) => {
          return <Addons {...props} />;
        }}
      />
      <Route
        path="/addons"
        render={(props: any) => {
          return <Addons {...props} />;
        }}
      />
      <Route
        path="/users"
        render={(props: any) => {
          return <Users {...props} />;
        }}
      />
      <Route
        exact
        path="/platform/projects"
        render={(props: any) => {
          return <Projects {...props} />;
        }}
      />
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
        path="/projects/:projectName/pipelines"
        render={(props: any) => {
          const mergeProps = { ...props, ...{ activeId: 'pipelines' } };
          return (
            <ProjectLayout {...mergeProps}>
              <ProjectPipelines {...mergeProps} />
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
      <Route
        exact
        path="/roles"
        render={(props: any) => {
          return <Roles {...props} />;
        }}
      />
      <Route
        exact
        path="/configs"
        render={(props: any) => {
          return <ConfigsLayout {...props} />;
        }}
      />
      <Route
        exact
        path="/configs/:templateName"
        render={(props: any) => {
          return <Redirect to={`/configs/${props.match.params.templateName}/config`} />;
        }}
      />
      <Route
        exact
        path="/configs/:templateName/config"
        render={(props: any) => {
          return (
            <ConfigsLayout {...props}>
              <Configs {...props} />
            </ConfigsLayout>
          );
        }}
      />
      <Route
        exact
        path="/definitions"
        render={() => {
          return <Redirect to={`/definitions/component/config`} />;
        }}
      />
      <Route
        exact
        path="/definitions/:definitionType"
        render={(props: any) => {
          return <Redirect to={`/definitions/${props.match.params.definitionType}/config`} />;
        }}
      />
      <Route
        exact
        path="/definitions/:definitionType/config"
        render={(props: any) => {
          return (
            <DefinitionsLayout {...props}>
              <Definitions {...props} />
            </DefinitionsLayout>
          );
        }}
      />
      <Route
        exact
        path="/definitions/:definitionType/:definitionName/ui-schema"
        render={(props: any) => {
          const mergeProps = { ...props, ...{ activeId: 'uiSchema' } };
          return (
            <DefinitionDetails {...mergeProps}>
              <UiSchema {...props} />
            </DefinitionDetails>
          );
        }}
      />
      <Route
        path="/settings"
        render={(props: any) => {
          return <PlatformSetting {...props}></PlatformSetting>;
        }}
      />
      <Route
        exact={true}
        path="/manage/plugins"
        render={(props: any) => {
          return <Addons plugin={true} {...props}></Addons>;
        }}
      />
      <Route
        path="/manage/plugins/:pluginId/config"
        render={(props: any) => {
          return <AppConfigPage pluginId={props.match.params.pluginId}></AppConfigPage>;
        }}
      />
      <Route
        path="/plugins/:pluginId"
        render={(props: any) => {
          return <AppRootPage pluginId={props.match.params.pluginId}></AppRootPage>;
        }}
      />
      <Route path="/notFound" component={NotFound} />
      <Redirect to="/notFound" />
    </Switch>
  );
}
