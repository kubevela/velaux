import React from 'react';

import { Translation } from '../../components/Translation';
export const pluginTitle = <Translation>Addon in management</Translation>;
export const pluginSubTitle = <Translation>Addon in extension</Translation>;

export const addClust = '新增集群';
export const clustTitle = '集群管理';
export const clustSubTitle = '集群管理介绍';
export const clustGroup = [
  { value: 'cluster1', label: 'cluster1' },
  { value: 'cluster2', label: 'cluster2' },
  { value: 'cluster3', label: 'cluster3' },
];
export const addClustDialog = {
  name: <Translation>Name</Translation>,
  namePlaceHold: <Translation>Input Cluster Name</Translation>,
  describe: <Translation>Description</Translation>,
  describePlaceHold: <Translation>Input Cluster Description</Translation>,
  kubeAPI: <Translation>KubeConfig</Translation>,
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
