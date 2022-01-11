export interface PodBase {
  cluster: string;
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

export interface Configuration {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    annotations: any;
    labels: any;
  };
  spec: {
    region: string;
    providerRef: {
      name: string;
      namespace: string;
    };
  };
  status?: {
    apply?: {
      outputs?: any;
      state?: string;
      message?: string;
    };
  };
}

export interface Secret {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    annotations: any;
    labels: any;
  };
  data: any;
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
  };
  ref: {
    kind: string;
    name: string;
    namespace: string;
    resourceVersion: string;
    uid: string;
  };
}
