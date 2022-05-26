import { get } from './request';

export function listApplicationPods(params: {
  appNs: string;
  appName: string;
  componentName?: string;
  cluster?: string;
  clusterNs?: string;
}) {
  let velaQLParams = `appNs=${params.appNs}, appName=${params.appName}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, clusterNs=${params.clusterNs}, ` + velaQLParams;
  }
  if (params.componentName) {
    velaQLParams = `name=${params.componentName}, ` + velaQLParams;
  }
  const urlParams = `component-pod-view{${velaQLParams}}.status`;
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

export function listApplicationServiceEndpoints(params: {
  appNs: string;
  appName: string;
  componentName?: string;
  cluster?: string;
  clusterNs?: string;
}) {
  let velaQLParams = `appNs=${params.appNs}, appName=${params.appName}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, clusterNs=${params.clusterNs}, ` + velaQLParams;
  }
  if (params.componentName) {
    velaQLParams = `name=${params.componentName}, ` + velaQLParams;
  }
  const urlParams = `service-endpoints-view{${velaQLParams}}.status`;
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}

export function listApplicationServiceAppliedResources(params: {
  appNs: string;
  appName: string;
  componentName?: string;
  cluster?: string;
  clusterNs?: string;
}) {
  let velaQLParams = `appNs=${params.appNs}, appName=${params.appName}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, clusterNs=${params.clusterNs}, ` + velaQLParams;
  }
  if (params.componentName) {
    velaQLParams = `name=${params.componentName}, ` + velaQLParams;
  }
  const urlParams = `service-applied-resources-view{${velaQLParams}}.status`;
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}

export function listApplicationResourceTree(params: {
  appNs: string;
  appName: string;
  componentName?: string;
  cluster?: string;
  clusterNs?: string;
}) {
  let velaQLParams = `appNs=${params.appNs}, appName=${params.appName}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, clusterNs=${params.clusterNs}, ` + velaQLParams;
  }
  if (params.componentName) {
    velaQLParams = `name=${params.componentName}, ` + velaQLParams;
  }
  const urlParams = `application-resource-tree-view{${velaQLParams}}.status`;
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}

export function detailResource(params: {
  name: string;
  namespace?: string;
  kind: string;
  apiVersion: string;
  cluster?: string;
}) {
  let velaQLParams = `name=${params.name}, kind=${params.kind}, apiVersion=${params.apiVersion}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, ` + velaQLParams;
  }
  if (params.namespace) {
    velaQLParams = `namespace=${params.namespace}, ` + velaQLParams;
  }
  const urlParams = `application-resource-detail-view{${velaQLParams}}.status`;
  return get('/api/v1/query', {
    params: {
      velaql: urlParams,
    },
  });
}
