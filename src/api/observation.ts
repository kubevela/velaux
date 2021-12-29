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

export function listCloudResources(params: { appNs: string; appName: string }) {
  const urlParams = `cloud-resource-view{appNs=${params.appNs},appName=${params.appName}}`;
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}

export function listCloudResourceSecrets(params: { appNs: string; appName?: string }) {
  let urlParams = `cloud-resource-secret-view{appNs=${params.appNs}}`;
  if (params.appName) {
    urlParams = `cloud-resource-secret-view{appNs=${params.appNs},appName=${params.appName}}`;
  }
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}

export function listApplicationService(params: {
  appNs: string;
  appName: string;
  cluster?: string;
  clusterNs?: string;
}) {
  let urlParams = `service-view{appNs=${params.appNs}, appName=${params.appName}}`;
  if (params.cluster) {
    urlParams = `service-view{appNs=${params.appNs}, appName=${params.appName}, cluster=${params.cluster},clusterNs=${params.clusterNs}}`;
  }
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}

export function listContainerLog(params: {
  cluster: string;
  namespace: string;
  pod: string;
  container: string;
  previous: boolean;
  timestamps: boolean;
  tailLines: number;
}) {
  const urlParams = `collect-logs{cluster=${params.cluster}, namespace=${params.namespace}, pod=${params.pod}, container=${params.container}, previous=${params.previous}, timestamps=${params.timestamps}, tailLines=${params.tailLines}}`;
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}
