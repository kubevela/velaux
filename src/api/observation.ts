import { get } from './request';

export function listApplicationPods(params: {
  appNs: string;
  appName: string;
  name: string;
  cluster?: string;
  clusterNs: string;
}) {
  let urlParams = `component-pod-view{appNs=${params.appNs},appName=${params.appName},name=${params.name}}.status`;
  if (params.cluster) {
    urlParams = `component-pod-view{appNs=${params.appNs},appName=${params.appName},name=${params.name},cluster=${params.cluster},clusterNs=${params.clusterNs}}.status`;
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
  const urlParams = `pod-view{namespace=${params.namespace},name=${params.name},cluster=${params.cluster}}.status`;
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}

export function listNamespaces(params: { cluster: string }) {
  const urlParams = `resource-view{type=ns,cluster=${params.cluster}}.status`;
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}
