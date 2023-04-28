import type { NameAlias } from './env';
import type { ObjectReference } from './kubernetes';
import type { Resource } from './observation';
import type { RunPhase, WorkflowStep } from './pipeline';
import type { Project } from './project';
import type { Target } from './target';

export interface ApplicationDetail extends ApplicationBase {
  resourceInfo: {
    componentNum: number;
  };
  envBindings: string[];
  policies: string[];
}

export interface EnvBinding {
  name: string;
  alias?: string;
  description?: string;
  targetNames: string[];
  targets?: Target[];
  createTime?: string;
  updateTime?: string;
  appDeployName: string;
  appDeployNamespace: string;
  workflow: NameAlias;
}

export interface ApplicationBase {
  name: string;
  alias: string;
  description?: string;
  project?: Project;
  createTime?: string;
  updateTime?: string;
  readOnly?: boolean;
  icon?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface DefinitionDetail {
  name: string;
  description: string;
  uiSchema: UIParam[];
  labels: Record<string, string>;
  status: string;
}

export interface UIParam {
  description?: string;
  jsonKey: string;
  label: string;
  sort: number;
  uiType: string;
  style?: {
    colSpan: number;
  };
  disable?: boolean;
  conditions?: ParamCondition[];
  subParameterGroupOption?: GroupOption[];
  additional?: boolean;
  additionalParameter?: UIParam;
  subParameters?: UIParam[];
  validate?: UIParamValidate;
}

export interface ParamCondition {
  jsonKey: string;
  op?: '==' | 'in' | '!=';
  value: any;
  action?: 'disable' | 'enable';
}

export interface GroupOption {
  label: string;
  keys: string[];
}

export interface UIParamValidate {
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: string }>;
  immutable?: boolean;
}

export interface ApplicationDeployRequest {
  appName: string;
  workflowName?: string;
  note?: string;
  triggerType: 'web';
  force: boolean;
}

export interface ApplicationDeployResponse extends ApplicationRevision {
  record?: WorkflowRecordBase;
}

export interface ApplicationRollbackResponse {
  record: WorkflowRecordBase;
}

export interface ApplicationEnvStatus {
  envName: string;
  status: ApplicationStatus;
}

export interface ApplicationStatus {
  conditions: Condition[];
  status:
    | 'starting'
    | 'rendering'
    | 'runningWorkflow'
    | 'workflowSuspending'
    | 'workflowTerminated'
    | 'workflowFailed'
    | 'running'
    | 'deleting'
    | string;
  workflow?: WorkflowStatus;
  latestRevision: {
    name: string;
    revision: number;
    revisionHash: string;
  };
  services?: ComponentStatus[];
  appliedResources: Resource[];
}

export interface ComponentStatus {
  name: string;
  namespace: string;
  healthy: boolean;
  message: string;
  traits?: TraitStatus[];
  cluster: string;
  workloadDefinition: {
    apiVersion: string;
    kind: string;
  };
}

export interface Condition {
  type: string;
  status: 'True' | 'False';
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface WorkflowStatus {
  appRevision: string;
  mode: string;
  status: RunPhase;
  message: string;

  suspend: boolean;
  suspendState: string;
  terminated: boolean;
  finished: boolean;

  contextBackend?: ObjectReference;
  steps?: WorkflowStepStatus[];

  startTime?: string;
  endTime?: string;
}

interface StepStatus {
  id: string;
  name: string;
  alias: string;
  type: string;
  phase: 'succeeded' | 'failed' | 'skipped' | 'stopped' | 'running' | 'pending';
  message?: string;
  reason?: string;
  firstExecuteTime?: string;
  lastExecuteTime?: string;
}

export interface WorkflowStepStatus extends StepStatus {
  subSteps?: StepStatus[];
}

export type WorkflowMode = 'StepByStep' | 'DAG';

export interface UpdateWorkflowRequest {
  alias?: string;
  description?: string;
  mode: WorkflowMode;
  subMode: WorkflowMode;
  steps: WorkflowStep[];
  default?: boolean;
}

export interface CreateWorkflowRequest {
  name: string;
  envName: string;
  alias?: string;
  description?: string;
  mode: WorkflowMode;
  subMode: WorkflowMode;
  steps: WorkflowStep[];
  default?: boolean;
}

export interface Trait {
  alias?: string;
  description?: string;
  properties?: any;
  type: string;
  createTime?: string;
  updateTime?: string;
}

export interface TraitStatus {
  type: string;
  healthy: string;
  message: string;
}

export interface ApplicationComponentBase {
  name: string;
  alias?: string;
  description?: string;
  labels?: Record<string, string>;
  componentType: string;
  creator?: string;
  main: boolean;
  dependsOn?: string[];
  createTime?: string;
  updateTime?: string;
  input?: InputItem[];
  output?: OutputItem[];
  traits?: Trait[];
  workloadType?: {
    definition?: {
      apiVersion: string;
      kind: string;
    };
    type: string;
  };
}

export interface InputItem {
  parameterKey: string;
  from: string;
}

export interface OutputItem {
  valueFrom: string;
  name: string;
}

export interface ApplicationComponent extends ApplicationComponentBase {
  properties?: any;
  type: string;
  definition: {
    workload: {
      definition?: {
        apiVersion: string;
        kind: string;
      };
      type: string;
    };
  };
}

export interface ApplicationRevision {
  createTime?: string;
  deployUser?:
    | string
    | {
        name: string;
        alias: string;
      };
  envName?: string;
  note?: string;
  reason?: string;
  status?: string;
  triggerType?: string;
  version: string;
  codeInfo?: {
    commit?: string;
    branch?: string;
    user?: string;
  };
  imageInfo?: {
    type: string;
    resource?: {
      digest: string;
      tag: string;
      url: string;
      createTime: string;
    };
    repository?: {
      name: string;
      namespace: string;
      fullName: string;
      region: string;
      type: string;
      createTime: string;
    };
  };
}

export interface ApplicationRevisionDetail extends ApplicationRevision {
  applyAppConfig: string;
}

export interface ApplicationStatistics {
  envCount: number;
  targetCount: number;
  revisionCount: number;
  workflowCount: number;
}

export interface Workflow {
  alias?: string;
  name: string;
  envName: string;
  description?: string;
  default: boolean;
  createTime?: string;
  enable: boolean;
  mode: WorkflowMode;
  subMode: WorkflowMode;
  steps: WorkflowStep[];
}

export interface UpdateComponentProperties {
  appName?: string;
  componentName?: string;
  properties: string;
}

export interface WorkflowRecordBase {
  name: string;
  namespace: string;
  workflowAlias?: string;
  workflowName: string;
  startTime?: string;
  endTime?: string;
  status?: RunPhase;
  mode?: string;
  message?: string;
  applicationRevision?: string;
}

export interface WorkflowRecord extends WorkflowRecordBase {
  steps?: WorkflowStepStatus[];
}

export interface Trigger {
  name: string;
  alias?: string;
  description?: string;
  workflowName: string;
  type: 'webhook';
  payloadType?: 'custom' | 'dockerHub' | 'ACR' | 'harbor' | 'artifactory';
  registry?: string;
  token: string;
  createTime?: string;
  updateTime?: string;
  componentName?: string;
}

export interface CreateTriggerRequest {
  name: string;
  alias?: string;
  description?: string;
  workflowName: string;
  type: 'webhook';
  payloadType?: 'custom' | 'dockerHub' | 'ACR' | 'harbor' | 'artifactory';
  registry?: string;
  componentName?: string;
}

export interface UpdateTriggerRequest {
  alias?: string;
  description?: string;
  workflowName: string;
  payloadType?: 'custom' | 'dockerHub' | 'ACR' | 'harbor' | 'artifactory';
  registry?: string;
  componentName?: string;
}

export interface ApplicationComponentConfig {
  name: string;
  alias: string;
  description: string;
  componentType?: string;
  properties: any;
  traits?: Trait[];
  dependsOn?: string[];
}

export interface TraitDefinitionSpec {
  podDisruptive?: boolean;
  appliesToWorkloads?: string[];
}
export interface ApplicationQuery {
  query?: string;
  project?: string;
  env?: string;
  targetName?: string;
  labels?: string;
}

export interface ComponentDefinitionsBase {
  name: string;
  workloadType?: string;
}

export interface ApplicationPolicyBase {
  createTime: string;
  creator: string;
  description: string;
  name: string;
  alias?: string;
  properties: {};
  type: string;
  updateTime: string;
  envName?: string;
}

export interface ApplicationPolicyDetail extends ApplicationPolicyBase {
  workflowPolicyBind?: WorkflowPolicyBinding[];
}

export interface ApplicationCompareResponse {
  isDiff: boolean;
  diffReport: string;
  baseAppYAML: string;
  targetAppYAML: string;
}

export interface ApplicationCompareRequest {
  compareRevisionWithRunning?: { revision?: string };
  compareRevisionWithLatest?: { revision?: string };
  compareLatestWithRunning?: { env: string };
}

export interface ApplicationDryRunRequest {
  dryRunType: 'APP' | 'REVISION';
  env?: string;
  workflow: string;
  version?: string;
}

export interface ApplicationDryRunResponse {
  yaml: string;
  success: boolean;
  message?: string;
}

export interface UpdatePolicyRequest {
  description?: string;
  alias?: string;
  properties: string;
  envName?: string;
  type: string;
  workflowPolicyBind?: WorkflowPolicyBinding[];
}

export interface CreatePolicyRequest extends UpdatePolicyRequest {
  name: string;
}

export interface WorkflowPolicyBinding {
  name: string;
  steps: string[];
}
