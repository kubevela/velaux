import type { Condition, InputItem, LoopStatus, OutputItem, WorkflowMode, WorkflowStepStatus } from './application';
import type { NameAlias } from './env';
import { KeyValue } from "../types";

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

interface PipelineMeta {
  name: string;
  alias?: string;
  description?: string;
  project: NameAlias;
  createTime?: string;
}

export interface PipelineListItem extends PipelineMeta {
  info?: {
    lastRun?: PipelineRun;
    runStat?: {
      activeNum: number;
      total: RunStateInfo;
      week: RunStateInfo[];
    };
  };
}

export interface PipelineSpec {
  mode: PipelineRunMode;
  steps: WorkflowStep[];
}

export interface PipelineBase extends PipelineMeta {
  spec: PipelineSpec;
}

export interface PipelineRun extends PipelineRunBase {
  status?: PipelineRunStatus;
}

export interface PipelineDetail {
  alias: string;
  description: string;
  name: string;
  project: NameAlias;
  createTime?: string;
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

export interface WorkflowStepBase {
  name: string;
  alias?: string;
  description?: string;
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
  mode?: WorkflowMode;
  subSteps?: WorkflowStepBase[];
  // forEach repeats the step, or a group's steps, once per item.
  forEach?: ForEach;
}

// ForEach is the list a step repeats over: items given in place (a list, or a
// $( ) expression that resolves to one), or read from a workflow variable.
export interface ForEach {
  items?: any;
  from?: string;
  // key names each item by these paths into it, joined with -, so its passes
  // are <loop>-<key>; none numbers them.
  key?: string[];
  mode?: WorkflowMode;
}

interface PipelineRunMode {
  steps?: WorkflowMode;
  subSteps?: WorkflowMode;
}

export type RunPhase =
  | 'initializing'
  | 'executing'
  | 'suspending'
  | 'terminated'
  | 'failed'
  | 'succeeded'
  | 'skipped'
  | string;

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
  // loops are the run's loop steps by name.
  loops?: Record<string, PipelineRunLoop>;
}

// PipelineRunLoop is a loop of a pipeline run: its items, and the item each of
// its passes ran for, by pass name.
export interface PipelineRunLoop extends LoopStatus {
  iterations?: Record<string, number>;
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
