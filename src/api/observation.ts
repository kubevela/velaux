import { get } from './request';

export function listApplicationPods(params: {
  namespace?: string;
  appName: string;
  componentName: string;
  cluster?: string;
}) {
  let urlParams = `component-pod-view{namespace=${params.namespace},name=${params.appName},componentName=${params.componentName}}.status`;
  if (params.cluster) {
    urlParams = `component-pod-view{namespace=${params.namespace},name=${params.appName},componentName=${params.componentName},cluster=${params.cluster}}.status`;
  }
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}

export function listApplicationPodsDetails(params: {
  namespace: string;
  name: string;
  cluster: string;
}) {
  let urlParams = `pod-view{namespace=${params.namespace},name=${params.name}}.status`;
  if (params.cluster) {
    urlParams = `pod-view{namespace=${params.namespace},name=${params.name},cluster=${params.cluster}}.status`;
  }
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}

export function listNamespaces(params: { cluster: string }) {
  let urlParams = `resource-view{type=ns,cluster=${params.cluster}}.status`;
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}
