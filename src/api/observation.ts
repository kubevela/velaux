import { get } from './request';

export function listApplicationPods(params: {
  namespace: string;
  appName: string;
  componentName: string;
}) {
  return get('/api/v1/query', {
    params: {
      velaql: `component-pod-view{namespace=${params.namespace},name=${params.appName},componentName=${params.componentName}}.status`,
    },
  });
}
