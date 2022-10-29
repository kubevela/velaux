import type { Condition, InputItem, OutputItem, WorkflowStepStatus } from './application';
import type { NameAlias } from './env';

export interface CreatePipelineRequest {
  name: string;
  project: string;
  alias?: string;
  description?: string;
  spec: {
    steps: WorkflowStep[];
    mode?: PipelineRunMode;
  };
}
export interface Pipeline {
  name: string;
  alias?: string;
  description?: string;
  project: NameAlias;
  createTime?: string;
  info?: {
    lastRun?: PipelineRun;
    runStat?: {
      activeNum: number;
      total: RunStateInfo;
      week: RunStateInfo[];
    };
  };
}

export interface PipelineRun extends PipelineRunBase {
  status?: PipelineRunStatus;
}

export interface PipelineDetail {
  alias: string;
  description: string;
  name: string;
  project: NameAlias;
  spec: {
    steps: WorkflowStep[];
    mode?: PipelineRunMode;
  };
}

export interface RunStateInfo {
  total: number;
  success: number;
  fail: number;
}

export interface PipelineRunMeta {
  pipelineName: string;
  project: NameAlias;
  pipelineRunName: string;
}

export interface PipelineRunBase extends PipelineRunMeta {
  record: string;
  contextName?: string;
  contextValues?: KeyValue[];
  spec: PipelineRunSpec;
}

export interface KeyValue {
  key: string;
  value: string;
}

export interface PipelineRunBriefing {
  pipelineRunName: string;
  finished: boolean;
  phase: RunPhase;
  message: string;
  startTime: string;
  endTime: string;
  contextName: string;
  contextValues: KeyValue[];
}

interface PipelineRunSpec {
  context?: Record<string, any>;
  mode?: PipelineRunMode;
  workflowSpec: {
    steps: WorkflowStep[];
  };
}

interface WorkflowStepBase {
  name: string;
  type: string;
  meta?: {
    alias?: string;
  };
  if?: string;
  timeout?: string;
  dependsOn?: string[];
  inputs?: InputItem[];
  outputs?: OutputItem[];
  properties?: Record<string, any>;
}

export interface WorkflowStep extends WorkflowStepBase {
  subSteps?: WorkflowStepBase[];
}

interface PipelineRunMode {
  steps?: 'DAG' | 'StepByStep';
  subSteps?: 'DAG' | 'StepByStep';
}

type RunPhase =
  | 'initializing'
  | 'executing'
  | 'suspending'
  | 'terminated'
  | 'failed'
  | 'succeeded'
  | 'skipped';

export interface PipelineRunStatus {
  conditions?: Condition[];
  mode?: PipelineRunMode;
  status: RunPhase;
  message?: string;
  suspend: boolean;
  suspendState?: string;
  terminated: boolean;
  finished: boolean;
  steps?: WorkflowStepStatus[];
  startTime?: string;
  endTime?: string;
}

export interface WorkflowStepOutputs {
  stepName: string;
  stepID: string;
  values?: WorkflowStepOutputValue[];
}

export interface WorkflowStepInputs {
  name: string;
  id: string;
  type: string;
  values?: WorkflowStepInputValue[];
}

export interface WorkflowStepOutputValue {
  name: string;
  valueFrom: string;
  value: string;
}

export interface WorkflowStepInputValue {
  from: string;
  parameterKey?: string;
  value: string;
  fromStep: string;
}
