export interface PodBase {
  clusterName: string;
  hostIP: string;
  nodeName: string;
  podIP: string;
  podName: string;
  namespace: string;
  revision: string;
  status: string;
}

export interface Container {
  image: string;
  name: string;
  resource?: {
    limits?: {
      cpu: string;
      memory: string;
    };
    requests?: {
      cpu: string;
      memory: string;
    };
  };
  status?: Podstatus;
  usageResource?: {
    cpu: string;
    memory: string;
  };
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
  containers: Array<Container>;
  events: Array<Event>;
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
  managedFields?: Array<ManagedFields>;
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
