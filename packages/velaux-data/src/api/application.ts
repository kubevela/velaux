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
  status?: ApplicationStatusSummary;
}

// AppHealth is an application's health, as the list summarises it.
export type AppHealth = 'failed' | 'unhealthy' | 'suspended' | 'progressing' | 'healthy' | 'undeployed';

// ApplicationStatusSummary is an application's health at a glance: the worst
// of its envs, and its components counted across them.
export interface ApplicationStatusSummary {
  health: AppHealth;
  workflow?: string;
  components: number;
  healthyComponents: number;
  envs?: EnvStatusSummary[];
}

export interface EnvStatusSummary {
  env: string;
  health: AppHealth;
  phase: string;
  workflow?: string;
  components: number;
  healthyComponents: number;
}

export interface DefinitionDetail {
  name: string;
  description: string;
  uiSchema: UIParam[];
  labels: Record<string, string>;
  status: string;
  // outputSchema is a source definition's schema: the value $(source.<name>) reads.
  outputSchema?: any;
}

export interface UIParam {
  description?: string;
  jsonKey: string;
  label: string;
  sort: number;
  uiType: string;
  style?: {
    colSpan: number;
    format?: 'table';
    rowKey?: string;
    itemLabel?: string;
    placeholder?: string;
    advanced?: boolean;
    section?: string;
    optionsFrom?: string;
    expression?: 'never';
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
  message?: string;
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
  // What the API server returned with the admitted Application, such as a
  // notice that a namespace nears a definition's quota.
  warnings?: string[];
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
  dependencies?: ComponentDependency[];
  appliedApplicationPolicies?: AppliedApplicationPolicy[];
  sources?: ApplicationSourceStatus[];
  // paused is whether the controller is skipping the Application.
  paused?: boolean;
  // reconcileInterval is the Application's own resync period, where it sets one.
  reconcileInterval?: string;
  // restartWorkflow is a pending or recurring restart: "true", a time or an interval.
  restartWorkflow?: string;
  // workflowRestartScheduledAt is when KubeVela next restarts the workflow.
  workflowRestartScheduledAt?: string;
  // autoUpdate is whether the Application follows definition changes.
  autoUpdate?: boolean;
}

// ApplicationSourceStatus is how one spec.sources binding resolved.
export interface ApplicationSourceStatus {
  name: string;
  // type is the source definition, with its pinned revision where one was asked for.
  type?: string;
  // phase is Resolved, Stale, Failed or Unused: the worst of its resolutions.
  phase?: string;
  resolutions?: SourceResolution[];
  // autoUpdate is the outcome after the feature gate, the binding and any
  // publishVersion pin; message says which won when it is false.
  autoUpdate?: boolean;
  message?: string;
  consumedBy?: SourceConsumer[];
}

// SourceResolution is one cache entry behind a source, typically one per cluster.
export interface SourceResolution {
  storageKey?: string;
  clusters?: string[];
  phase?: string;
  // expiresAt is an RFC3339 timestamp.
  expiresAt?: string;
  message?: string;
}

// SourceConsumer is a reader of a source, and what it took.
export interface SourceConsumer {
  // definitionKind is component, trait, workflowstep or policy.
  definitionKind: string;
  // name is the reader; a trait is "<component>/<trait>".
  name: string;
  type?: string;
  cluster?: string;
  namespace?: string;
  // values are absent when the binding's statusPolicy withholds them.
  values?: SourceValue[];
}

// SourceValue is one value read: the source attribute and the property it fed.
export interface SourceValue {
  sourceAttr: string;
  property?: string;
  // value is redacted where the attribute is sensitive or masked.
  value?: unknown;
}

// One component another depends on, as the Application's status reports it:
// named in dependsOn, read through inputs, or read by a property expression,
// with the cluster and namespace an expression names.
export interface ComponentDependency {
  component: string;
  dependsOn: string;
  source: 'dependsOn' | 'inputs' | 'expression';
  cluster?: string;
  namespace?: string;
}

// AppliedApplicationPolicy is how one application-scoped policy fared on the
// Application's last render: named in spec.policies (explicit), or applied to
// every Application in its namespace (global).
export interface AppliedApplicationPolicy {
  name: string;
  type?: string;
  namespace?: string;
  source?: 'global' | 'explicit';
  applied: boolean;
  error?: boolean;
  message?: string;
}

export interface ComponentStatus {
  name: string;
  namespace: string;
  healthy: boolean;
  workloadHealthy?: boolean;
  message: string;
  details?: Record<string, string>;
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
  phase: 'succeeded' | 'failed' | 'skipped' | 'stopped' | 'running' | 'pending' | 'suspending';
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
  // mode and subMode may be empty for a workflow with a ref, to follow the
  // shared workflow's.
  mode: WorkflowMode | '';
  subMode: WorkflowMode | '';
  steps: WorkflowStep[];
  default?: boolean;
  // ref names a shared Workflow to run in place of steps.
  ref?: string;
}

// SharedWorkflowScope is where a shared Workflow is: the project's namespace,
// vela-system, or, for a ref only, an environment namespace that is not the
// project's.
export type SharedWorkflowScope = 'project' | 'global' | 'environment';

// SharedWorkflow is a Workflow resource that application workflows can
// reference: the project's or a global one.
export interface SharedWorkflow {
  name: string;
  namespace: string;
  scope: SharedWorkflowScope;
  alias?: string;
  description?: string;
  // hidden: a global one where the project has one of its name.
  hidden?: boolean;
  mode?: WorkflowMode;
  subMode?: WorkflowMode;
  steps: WorkflowStep[];
  // usedBy names the project's workflows that run it; usedElsewhere counts
  // other projects'.
  usedBy?: SharedWorkflowUse[];
  usedElsewhere?: number;
}

// SharedWorkflowUse is an application workflow that runs a shared one.
export interface SharedWorkflowUse {
  appName: string;
  appAlias?: string;
  workflowName: string;
  workflowAlias?: string;
  envName: string;
}

export interface ListSharedWorkflowsResponse {
  workflows: SharedWorkflow[];
  // globalUnavailable: the global ones could not be read.
  globalUnavailable?: boolean;
  // projectUnavailable: the environment's Applications run outside the
  // project's namespace, where KubeVela cannot find the project's.
  projectUnavailable?: boolean;
  projectNamespace?: string;
}

export interface SharedWorkflowRequest {
  name: string;
  alias?: string;
  description?: string;
  mode?: WorkflowMode | '';
  subMode?: WorkflowMode | '';
  steps: WorkflowStep[];
}

export interface CreateWorkflowRequest {
  name: string;
  envName: string;
  alias?: string;
  description?: string;
  mode: WorkflowMode | '';
  subMode: WorkflowMode | '';
  ref?: string;
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
  healthy: boolean;
  pending?: boolean;
  message: string;
  details?: Record<string, string>;
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
  mode: WorkflowMode | '';
  subMode: WorkflowMode | '';
  steps: WorkflowStep[];
  // ref names the shared Workflow this one runs, whose steps are in steps;
  // sharedMode and sharedSubMode are its modes, which apply where mode and
  // subMode are empty.
  ref?: string;
  sharedScope?: SharedWorkflowScope;
  sharedMode?: WorkflowMode;
  sharedSubMode?: WorkflowMode;
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
  withStatus?: boolean;
  // addons is exclude, to leave out the applications addons install, or only.
  addons?: 'exclude' | 'only';
}

export interface ComponentDefinitionsBase {
  name: string;
  workloadType?: string;
  unusableIn?: string[];
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

// ApplicationSource is an external value the application's properties read
// with $(source.<name>).
export interface ApplicationSource {
  name: string;
  type: string;
  properties?: Record<string, any>;
  // autoUpdate is whether a change to the source's value re-dispatches what
  // reads it; unset follows the controller's default.
  autoUpdate?: boolean;
}

export interface ApplicationPolicyDetail extends ApplicationPolicyBase {
  workflowPolicyBind?: WorkflowPolicyBinding[];
}

export interface ApplicationCompareResponse {
  isDiff: boolean;
  // error says why the two could not be compared; isDiff is then false
  // because nothing is known, not because nothing differs.
  error?: string;
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

// DataFlowEnd is one end of a data flow: a source binding or a component, at a
// placement where one is known.
export interface DataFlowEnd {
  kind: 'source' | 'component';
  name: string;
  cluster?: string;
  namespace?: string;
}

// DataFlowItem is one value moving along a flow: what was read, and the
// reader's property that received it; value where KubeVela records it.
export interface DataFlowItem {
  read: string;
  property?: string;
  trait?: string;
  value?: any;
}

// DataFlow is what moves from a producer to a reader: via source, expression,
// inputs, or dependsOn (order only, no items).
export interface DataFlow {
  from: DataFlowEnd;
  to: DataFlowEnd;
  via: 'source' | 'expression' | 'inputs' | 'dependsOn';
  items: DataFlowItem[];
}
