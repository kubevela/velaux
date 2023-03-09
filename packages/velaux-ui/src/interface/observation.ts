import type { ApplicationComponent, ComponentStatus } from './application';

export interface PodBase {
  cluster: string;
  component: string;
  metadata: {
    creationTime: string;
    name: string;
    namespace: string;
    version: {
      deployVersion: string;
      publishVersion: string;
      revision: string;
    };
  };
  status: {
    phase: string;
    podIP?: string;
    hostIP?: string;
    nodeName?: string;
  };
  workload: {
    apiVersion: string;
    kind: string;
  };
}

export interface Container {
  image: string;
  name: string;
  resources?: {
    limits?: {
      cpu: string;
      memory: string;
    };
    requests?: {
      cpu: string;
      memory: string;
    };
    usage?: {
      cpu: string;
      memory: string;
    };
  };
  status?: Podstatus;
}

export interface Podstatus {
  restartCount: number;
  state: {
    running?: {};
    terminated?: {};
    waiting?: {};
  };
}

export interface PodDetailBase {
  containers: Container[];
  events: Event[];
}

export interface Event {
  TypeMeta: {};
  count?: number;
  action?: string;
  eventTime?: string | null;
  firstTimestamp?: string | null;
  involvedObject?: {
    apiVersion?: string;
    fieldPath?: string;
    kind?: string;
    name?: string;
    namespace?: string;
    resourceVersion?: string;
    uid?: string;
  };
  lastTimestamp?: string | null;
  message: string;
  metadata?: Metadata;
  reason: string;
  reportingComponent?: string;
  reportingInstance?: string;
  source?: {
    component: string;
    host?: string;
  };
  type: string;
}

export interface Metadata {
  creationTimestamp?: string;
  managedFields?: ManagedFields[];
  name: string;
  namespace: string;
  resourceVersion: string;
  selfLink: string;
  uid: string;
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface ManagedFields {
  apiVersion?: string;
  fieldsType?: string;
  fieldsV1?: any;
  manager: string;
  operation: string;
  time: string;
}

export interface CloudResource {
  name: string;
  region: string;
  url: string;
  status: string;
}

export interface Configuration extends ResourceObject {
  apiVersion: string;
  kind: string;
  spec: {
    providerRef: {
      name: string;
      namespace: string;
    };
    region?: string;
  };
  status?: {
    apply?: {
      outputs?: any;
      state?: string;
      message?: string;
      region?: string;
    };
  };
}

export interface Secret {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    annotations: Record<string, string>;
    labels: Record<string, string>;
  };
  data: Record<string, string>;
}

export interface Service {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    annotations: any;
    labels: any;
  };
  spec: {
    type: string;
    ports?: [
      {
        nodePort: number;
        port: number;
        protocol: string;
        targetPort: number;
      },
    ];
  };
  status?: {
    loadBalancer?: {
      ingress?: [{ ip: string }];
    };
  };
}

export interface ContainerLogResponse {
  logs: string;
  err: string;
  info: {
    fromDate: string;
    toDate: string;
  };
}

export interface Endpoint {
  endpoint: {
    appProtocol: string;
    host: string;
    port: number | string;
    protocol: string;
    path?: string;
    inner: boolean;
    portName?: string;
  };
  ref: {
    kind: string;
    name: string;
    namespace: string;
    resourceVersion: string;
    uid: string;
  };
}

export interface Resource {
  apiVersion?: string;
  cluster?: string;
  kind?: string;
  name: string;
  namespace?: string;
}

export interface AppliedResource extends Resource {
  component: string;
  trait?: string;
  publishVersion?: string;
  revision?: string;
  latest: boolean;
  resourceTree?: ResourceTreeNode;
}

export interface ResourceTreeNode extends Resource {
  uid?: string;
  healthStatus?: ResourceHealthStatus;
  additionalInfo?: Record<string, any>;
  leafNodes?: ResourceTreeNode[];

  // For the component node
  service?: ComponentStatus;
  component?: ApplicationComponent;
}

export interface ResourceHealthStatus {
  statusCode: string;
  reason: string;
  message: string;
}

export interface ResourceObject {
  metadata: Metadata;
}
