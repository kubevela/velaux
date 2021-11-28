import React from 'react';
import Translation from '../components/Translation';

export const addCluster = <Translation>Join New Cluster</Translation>;
export const editCluster = <Translation>Edit Cluster</Translation>;
export const clustTitle = <Translation>Cluster Management</Translation>;
export const clustSubTitle = <Translation>Introduction to cluster management</Translation>;
export const cloudServerTitle = <Translation>Connecting clusters from cloud services</Translation>;
export const UPLOADYMALFILE = <Translation>Upload Yaml File</Translation>;
export const SUPPLIER = <Translation>Supplier</Translation>;
export const NEXTSTEP = <Translation>NextStep</Translation>;
export const PLEASE_ENTER = 'Please enter';
export const PLEASE_CHOSE = 'Please select';

export const dataSourceProject = [
  { value: 10001, label: 'project1' },
  { value: 10002, label: 'project2' },
  { value: 10003, label: 'project3' },
];

export const dataSourceCluster = [
  { value: '10001', label: 'cluster1' },
  { value: 10002, label: 'cluster2' },
  { value: 10003, label: 'cluster3' },
];

export const dataSourceApps = [
  { value: '10001', label: 'app1' },
  { value: 10002, label: 'app2' },
  { value: 10003, label: 'app3' },
];
export const clustGroup = [
  { value: 'cluster1', label: 'cluster1' },
  { value: 'cluster2', label: 'cluster2' },
  { value: 'cluster3', label: 'cluster3' },
];
export const addClustDialog = {
  name: '集群名称',
  alias: '集群别名',
  aliasPlaceHold: '请输入集群别名',
  namePlaceHold: '请输入集群名称',
  describe: '集群说明',
  describePlaceHold: 'description',
  kubeAPI: 'KubeAPI 通信密钥',
  dashboardURL: 'Dashboard地址',
  dashboarPlaceHold: '设置kubernetes集群的Dashboard地址',
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

export const supplierList = [{ value: 'aliyun', label: '阿里云 ACK' }];
export const addonDetail = <Translation>Addon Detail</Translation>;
export const addDeliveryTargetList = <Translation>Add DeliveryTarget</Translation>;
export const editDeliveryTargetList = <Translation>Edit DeliveryTarget</Translation>;
