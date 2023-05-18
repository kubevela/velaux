import type { ResourceObject } from '@velaux/data';

export interface KubernetesObject extends ResourceObject {
  apiVersion: string;
  kind: string;
  spec?: Record<string, any>;
}

export function isDeployment(object: KubernetesObject): boolean {
  return object.kind === 'Deployment';
}

export function isShowConvertButton(objects: KubernetesObject[]): boolean {
  return objects.filter((ob) => isDeployment(ob)).length > 0;
}

export function buildWebServiceBaseDeployment(object: KubernetesObject): Record<string, any> {
  return {
    image: object.spec?.containers[0].image,
    ports: [],
    readinessProbe: {},
    livenessProbe: {},
    env: [],
    memory: '',
    cpu: '',
  };
}
