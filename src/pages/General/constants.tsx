import Translation from '../../components/Translation';

export const MANAGER_TITLE = <Translation>App Manager</Translation>;
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
