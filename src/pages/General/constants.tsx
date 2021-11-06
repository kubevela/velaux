import React, { Component } from 'react';
import Translation from '../../components/Translation';

export const MANAGER_TITLE = <Translation>AppPlan Manager</Translation>;
export const MANAGER_NAME = <Translation>App Name-</Translation>;
export const OVERVIEW = <Translation>Overview</Translation>;
export const DEPLOYMENT_UPDATE = <Translation>Deployment update</Translation>;
export const PUBLISH_MODEL = <Translation>Publish model</Translation>;
export const DEPLOYED = <Translation>Deployed</Translation>;
export const VIEW_DETAILS = <Translation>View details</Translation>;
export const SERVER_COMPONENTS = <Translation>Server components</Translation>;
export const JOB_COMPONENTS = <Translation>Job components</Translation>;
export const STATUS_COMPONENTS = <Translation>Status components</Translation>;
export const RDS_COMPONENTS = <Translation>Rds components</Translation>;
export const CLOUD_REDIS = <Translation>Cloud redis</Translation>;
export const POLICIES = <Translation>Policies</Translation>;
export const HEALTH_MONITORING = <Translation>health monitoring</Translation>;
export const MULTI_ENVIRONMENT_DELIVERY = <Translation>Multi environment delivery</Translation>;
export const PUBLISH_APPLICATION_TEMPLATE = <Translation>Publish application template</Translation>;
export const NEW_COMPONENTS = <Translation>New components</Translation>;
export const COMPONENT_NAME = <Translation>Component name</Translation>;
export const COMPONENT_ALIAS = <Translation>Component alias</Translation>;
export const COMPONENT_DESCRIPTION = <Translation>Component description</Translation>;
export const COMPONENT_DEPENDENCY = <Translation>Component dependency</Translation>;
export const LABEL = <Translation>Label</Translation>;
export const ENVIRONMENT_BINDING = <Translation>Environment binding</Translation>;
export const INHERIT_ENVIRONMENTAL_PLANNING = (
  <Translation>Inherit environmental planning</Translation>
);
export const COMPONENT_CONFIGURATION = <Translation>Component configuration</Translation>;
export const CREATE = <Translation>Create</Translation>;
export const DEPLOYMENT_PLANS = <Translation>Deployment plans</Translation>;
export const NOT_YEW_PLEASE_GO_AND_CREATE = (
  <Translation>Not yet, please go and create</Translation>
);
export const APP_POLICIES = <Translation>App policies</Translation>;

export const publishDialog = {
  title: <Translation>Publish as application template</Translation>,
  name: <Translation>Template name</Translation>,
  namePlaceHold: 'Enter template name',
  version: <Translation>Template version</Translation>,
  versionPlaceHold: 'Enter version overview',
};

export const dataSourceAppNames = [
  { value: 'SpringCloud', label: 'SpringCloud' },
  { value: 'SpringCloud2', label: 'SpringCloud2' },
  { value: 'SpringCloud3', label: 'SpringCloud3' },
];

export const componGroups = [
  {
    imgSrc: '../../assets/card.png',
    title: SERVER_COMPONENTS,
    id: 'server',
  },
  {
    imgSrc: '../../assets/card.png',
    title: JOB_COMPONENTS,
    id: 'job',
  },
  {
    imgSrc: '../../assets/card.png',
    title: STATUS_COMPONENTS,
    id: 'status',
  },
  {
    imgSrc: '../../assets/card.png',
    title: RDS_COMPONENTS,
    id: 'reds',
  },
  {
    imgSrc: '../../assets/card.png',
    title: CLOUD_REDIS,
    id: 'cloud_redis',
  },
];
