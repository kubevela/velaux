import { get } from './request';

// query runs a VelaQL view. With a project it reads as the signed-in user in
// that project; without one, only an admin may run it, across every project.
function query(velaql: string, project?: string) {
  return get('/api/v1/query', { params: project ? { velaql, project } : { velaql } });
}

export function listApplicationPods(params: {
  appNs: string;
  appName: string;
  componentName?: string;
  cluster?: string;
  clusterNs?: string;
  project: string;
}) {
  let velaQLParams = `appNs=${params.appNs}, appName=${params.appName}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, clusterNs=${params.clusterNs}, ` + velaQLParams;
  }
  if (params.componentName) {
    velaQLParams = `name=${params.componentName}, ` + velaQLParams;
  }
  const urlParams = `component-pod-view{${velaQLParams}}.status`;
  return query(urlParams, params.project);
}

export function listApplicationPodsDetails(params: {
  namespace: string;
  name: string;
  cluster: string;
  project: string;
}) {
  const urlParams = `pod-view{namespace=${params.namespace},name=${params.name},cluster=${params.cluster}}.status`;
  return query(urlParams, params.project);
}

export function listNamespaces(params: { cluster: string; project?: string }) {
  const urlParams = `resource-view{type=ns,cluster=${params.cluster}}.status`;
  return query(urlParams, params.project);
}

export function listCloudResources(params: { appNs: string; appName: string; project: string }) {
  const urlParams = `cloud-resource-view{appNs=${params.appNs},appName=${params.appName}}`;
  return query(urlParams, params.project);
}

export function listCloudResourceSecrets(params: { appNs: string; appName?: string; project: string }) {
  let urlParams = `cloud-resource-secret-view{appNs=${params.appNs}}`;
  if (params.appName) {
    urlParams = `cloud-resource-secret-view{appNs=${params.appNs},appName=${params.appName}}`;
  }
  return query(urlParams, params.project);
}

export function listApplicationService(params: {
  appNs: string;
  appName: string;
  cluster?: string;
  clusterNs?: string;
  project: string;
}) {
  let urlParams = `service-view{appNs=${params.appNs}, appName=${params.appName}}`;
  if (params.cluster) {
    urlParams = `service-view{appNs=${params.appNs}, appName=${params.appName}, cluster=${params.cluster},clusterNs=${params.clusterNs}}`;
  }
  return query(urlParams, params.project);
}

export function listContainerLog(params: {
  cluster: string;
  namespace: string;
  pod: string;
  container: string;
  previous: boolean;
  timestamps: boolean;
  tailLines: number;
  project: string;
}) {
  const urlParams = `collect-logs{cluster=${params.cluster}, namespace=${params.namespace}, pod=${params.pod}, container=${params.container}, previous=${params.previous}, timestamps=${params.timestamps}, tailLines=${params.tailLines}}`;
  return query(urlParams, params.project);
}

export function listApplicationServiceEndpoints(params: {
  appNs: string;
  appName: string;
  componentName?: string;
  cluster?: string;
  clusterNs?: string;
  project: string;
}) {
  let velaQLParams = `appNs=${params.appNs}, appName=${params.appName}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, clusterNs=${params.clusterNs}, ` + velaQLParams;
  }
  if (params.componentName) {
    velaQLParams = `name=${params.componentName}, ` + velaQLParams;
  }
  const urlParams = `service-endpoints-view{${velaQLParams}}.status`;
  return query(urlParams, params.project);
}

export function listApplicationServiceAppliedResources(params: {
  appNs: string;
  appName: string;
  componentName?: string;
  cluster?: string;
  clusterNs?: string;
  project: string;
}) {
  let velaQLParams = `appNs=${params.appNs}, appName=${params.appName}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, clusterNs=${params.clusterNs}, ` + velaQLParams;
  }
  if (params.componentName) {
    velaQLParams = `name=${params.componentName}, ` + velaQLParams;
  }
  const urlParams = `service-applied-resources-view{${velaQLParams}}.status`;
  return query(urlParams, params.project);
}

export function listApplicationResourceTree(params: {
  appNs: string;
  appName: string;
  componentName?: string;
  cluster?: string;
  clusterNs?: string;
  project: string;
}) {
  let velaQLParams = `appNs=${params.appNs}, appName=${params.appName}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, clusterNs=${params.clusterNs}, ` + velaQLParams;
  }
  if (params.componentName) {
    velaQLParams = `name=${params.componentName}, ` + velaQLParams;
  }
  const urlParams = `application-resource-tree-view{${velaQLParams}}.status`;
  return query(urlParams, params.project);
}

// listEnvResourceTree is the resource tree an application's env deploys, its
// health read by kstatus for the kinds KubeVela does not check itself.
export function listEnvResourceTree(params: {
  appName: string;
  envName: string;
  componentName?: string;
  cluster?: string;
  clusterNs?: string;
}) {
  const { appName, envName, ...query } = params;
  return get(`/api/v1/applications/${appName}/envs/${envName}/resource-tree`, { params: query });
}

export function detailResource(params: {
  name: string;
  namespace?: string;
  kind: string;
  apiVersion: string;
  cluster?: string;
  project: string;
}) {
  let velaQLParams = `name=${params.name}, kind=${params.kind}, apiVersion=${params.apiVersion}`;
  if (params.cluster) {
    velaQLParams = `cluster=${params.cluster}, ` + velaQLParams;
  }
  if (params.namespace) {
    velaQLParams = `namespace=${params.namespace}, ` + velaQLParams;
  }
  const urlParams = `application-resource-detail-view{${velaQLParams}}.status`;
  return query(urlParams, params.project);
}
