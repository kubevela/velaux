import Translation from '../../components/Translation';

export const dataSourceProject = [
  { value: 'project1', label: 'project1' },
  { value: 'project2', label: 'project2' },
  { value: 'project3', label: 'project3' },
];
import React, { Component } from 'react';
export const dataSourceCluster = [
  { value: 'cluster1', label: 'cluster1' },
  { value: 'cluster2', label: 'cluster2' },
  { value: 'cluster3', label: 'cluster3' },
];

export const dataSourceApps = [
  { value: '10001', label: 'app1' },
  { value: 10002, label: 'app2' },
  { value: 10003, label: 'app3' },
];

export const managerTitle = <Translation>AppPlan Manager</Translation>;
export const managerName = '应用名称-';
export const managerSubTitle = <Translation>AppPlan ManagerSubTitle</Translation>;
export const addApp = <Translation>Add App</Translation>;
export const NEW_APPLICATION_DELIVERY_PLAN = <Translation>New Application</Translation>;
export const addAppDialog = {
  name: <Translation>App Name</Translation>,
  namePlaceHold: 'App Name placehold',
  project: <Translation>Project</Translation>,
  clusterBind: <Translation>Cluster Bind</Translation>,
  clustPlaceHold: 'Clust Placehold',
  describe: <Translation>App Describe</Translation>,
  describePlaceHold: 'App DescribePlaceHol',
  ENVPLACEHOLD: <Translation>Environmental planning</Translation>,
};

export const appContent = [
  {
    imgSrc: '../../assets/card.png',
    title: 'SpringCloud',
    hasExtend: '',
    description: '这是个备注说明信息,说明应用业务的相关信息',
    btnContent: 'vela-system',
    date: '2020.03.24.10.44',
    status: '已部署',
  },
  {
    imgSrc: '',
    title: 'SpringCloud',
    hasExtend: '',
    description: '这是个备注说明信息,说明应用业务的相关信息',
    btnContent: 'vela-system',
    date: '2020.03.24.10.44',
    status: '已部署',
  },
  {
    imgSrc: '',
    title: 'SpringCloud',
    hasExtend: '',
    description: '这是个备注说明信息,说明应用业务的相关信息',
    btnContent: 'vela-system',
    date: '2020.03.24.10.44',
    status: '已部署',
  },
  {
    imgSrc: '',
    title: 'SpringCloud',
    hasExtend: '',
    description: '这是个备注说明信息,说明应用业务的相关信息',
    btnContent: 'vela-system',
    date: '2020.03.24.10.44',
    status: '已部署',
  },
  {
    imgSrc: '',
    title: 'SpringCloud',
    hasExtend: '',
    description: '这是个备注说明信息,说明应用业务的相关信息',
    btnContent: 'vela-system',
    date: '2020.03.24.10.44',
    status: '已部署',
  },
  {
    imgSrc: '',
    title: 'SpringCloud',
    hasExtend: '',
    description: '这是个备注说明信息,说明应用业务的相关信息',
    btnContent: 'vela-system',
    date: '2020.03.24.10.44',
    status: '已部署',
  },
];

export const pluginTitle = '插件管理';
export const pluginSubTitle =
  '统一管理组件类型扩展、集群治理能力扩展和系统插件扩展等插件, 用户可获取社区丰富的扩展能力';

export const addClust = '新增集群';
export const clustTitle = '集群管理';
export const clustSubTitle = '集群管理介绍';
export const clustGroup = [
  { value: 'cluster1', label: 'cluster1' },
  { value: 'cluster2', label: 'cluster2' },
  { value: 'cluster3', label: 'cluster3' },
];
export const addClustDialog = {
  name: '集群名称',
  namePlaceHold: '集群名称',
  describe: '集群说明',
  describePlaceHold: 'description',
  kubeAPI: 'KubeAPI 通信密钥',
};

export const workflowSet = 'Workflow设置';
export const execuResult = '执行记录';

export const dataSourceAppNames = [
  { value: 'SpringCloud', label: 'SpringCloud' },
  { value: 'SpringCloud2', label: 'SpringCloud2' },
  { value: 'SpringCloud3', label: 'SpringCloud3' },
];

export const componGroups = [
  {
    imgSrc: '../../assets/card.png',
    title: 'Server组件',
    id: 'server',
  },
  {
    imgSrc: '../../assets/card.png',
    title: 'Job组件',
    id: 'job',
  },
  {
    imgSrc: '../../assets/card.png',
    title: '有状态组件',
    id: 'status',
  },
  {
    imgSrc: '../../assets/card.png',
    title: 'RDS组件',
    id: 'reds',
  },
  {
    imgSrc: '../../assets/card.png',
    title: '云Redis',
    id: 'cloud_redis',
  },
];
