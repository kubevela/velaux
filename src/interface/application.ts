import { DeliveryTarget } from './deliveryTarget';

export interface ApplicationDetail {
  name: string;
  alias?: string;
  namespace: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  icon?: string;
  labels?: {};
  gatewayRule: null;
  policies: Array<string>;
  resourceInfo: {
    componentNum: Number;
  };
  workflowStatus?: Array<WorkflowStatus>;
}

export interface EnvBinding {
  name: string;
  alias?: string;
  description?: string;
  targetNames: Array<string>;
  deliveryTargets?: Array<DeliveryTarget>;
  componentSelector?: {
    components: Array<string>;
  };
  createTime?: string;
  updateTime?: string;
  appDeployName?: string;
}

export interface WorkflowStatus {
  name: string;
  status?: string;
  takeTime?: string;
}

export interface ApplicationBase {
  name: string;
  alias: string;
  btnContent?: string;
  icon: string;
  description: string;
  createTime: string;
  href?: string;
  dashboardURL?: string;
}

export interface DefinitionDetail {
  uiSchema: Array<UIParam>;
}

export interface UIParam {
  description?: string;
  jsonKey: string;
  label: string;
  sort: Number;
  uiType: string;
  disable?: boolean;
  subParameterGroupOption?: Array<GroupOption>;
  subParameters?: Array<UIParam>;
  validate: UIParamValidate;
}

export interface GroupOption {
  label: string;
  keys: Array<string>;
}

export interface UIParamValidate {
  required?: boolean;
  min?: Number;
  max?: Number;
  maxLength?: Number;
  minLength?: Number;
  pattern?: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: string }>;
}

export interface ImageInfo {
  imageURL: string;
  imageName: string;
  tag: string;
  repoHost: string;
  namespace: string;
  ports: Array<Number>;
  volumes: Array<ImageVolume>;
}

export interface ImageVolume {
  mountPath: string;
}

export interface ApplicationDeployRequest {
  appName: string;
  workflowName?: string;
  note?: string;
  triggerType: 'web';
  force: boolean;
}

export interface ApplicationStatus {
  conditions: Array<Condition>;
  status: string;
  workflow: WorkflowStatus;
  latestRevision: {
    name: string;
    revision: number;
    revisionHash: string;
  };
  components?: Array<{
    kind: string;
    namespace: string;
    name: string;
    apiVersion: string;
  }>;
  services?: Array<{
    name: string;
    env?: string;
    healthy: string;
    message: string;
    traits: Array<{
      type: string;
      healthy: string;
      message: string;
    }>;
  }>;
}

export interface Condition {
  type: string;
  status: string;
  lastTransitionTime: string;
  reason: string;
}

export interface WorkflowStatus {
  appRevision: string;
  mode: string;
  suspend: boolean;
  terminated: boolean;
  finished: boolean;
  steps: Array<WorkflowStepStatus>;
  startTime?: string;
}

export interface WorkflowStepStatus {
  id: string;
  name: string;
  type: string;
  phase: string;
  message: string;
  reason: string;
  firstExecuteTime?: string;
  lastExecuteTime?: string;
}

export interface Trait {
  alias?: string;
  description?: string;
  name?: string;
  properties?: any;
  type: string;
  createTime?: string;
  updateTime?: string;
}

export interface ApplicationComponent {
  alias?: string;
  appPrimaryKey?: string;
  createTime?: string;
  creator?: string;
  name?: string;
  properties?: any;
  traits?: Array<Trait>;
  type?: string;
  updateTime?: string;
}

export interface Revisions {
  createTime?: string;
  deployUser?: string;
  envName?: string;
  note?: string;
  reason?: string;
  status?: string;
  triggerType?: string;
  version: string;
}

export interface ApplicationStatistics {
  envCount: number;
  deliveryTargetCount: number;
  revisonCount: number;
  workflowCount: number;
}
