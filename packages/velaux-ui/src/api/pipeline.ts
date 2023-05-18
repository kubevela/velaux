import type { CreatePipelineRequest } from '@velaux/data';
import { getDomain } from '../utils/common';

import { get, post, put, rdelete } from './request';

const baseURLOject = getDomain();
const base = baseURLOject.MOCK || baseURLOject.APIBASE;

export function listPipelines(params: { projectName?: string; query?: string }) {
  const url = base + '/api/v1/pipelines';
  return get(url, { params: params }).then((res) => res);
}

export function createPipeline(params: CreatePipelineRequest) {
  const url = base + `/api/v1/projects/${params.project}/pipelines`;
  return post(url, params).then((res) => res);
}

export function updatePipeline(params: CreatePipelineRequest) {
  const url = base + `/api/v1/projects/${params.project}/pipelines/${params.name}`;
  return put(url, {
    description: params.description,
    alias: params.alias,
    spec: params.spec,
  }).then((res) => res);
}

export function loadPipeline(params: { projectName: string; pipelineName: string }) {
  const url = base + `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}`;
  return get(url, {}).then((res) => res);
}

export function deletePipeline(params: { projectName: string; pipelineName: string }) {
  const url = base + `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}`;
  return rdelete(url, {}).then((res) => res);
}

export function loadPipelineRuns(params: { projectName: string; pipelineName: string }) {
  const url = base + `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs`;
  return get(url, {}).then((res) => res);
}

export function deletePipelineRun(params: {
  projectName: string;
  pipelineName: string;
  runName: string;
}) {
  const url =
    base +
    `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs/${params.runName}`;
  return rdelete(url, {}).then((res) => res);
}

export function stopPipelineRun(params: {
  projectName: string;
  pipelineName: string;
  runName: string;
}) {
  const url =
    base +
    `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs/${params.runName}/stop`;
  return post(url, {}).then((res) => res);
}

export function loadPipelineRunBase(params: {
  projectName: string;
  pipelineName: string;
  runName: string;
}) {
  const url =
    base +
    `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs/${params.runName}`;
  return get(url, {}).then((res) => res);
}

export function loadPipelineRunStatus(params: {
  projectName: string;
  pipelineName: string;
  runName: string;
}) {
  const url =
    base +
    `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs/${params.runName}/status`;
  return get(url, {}).then((res) => res);
}

export function loadPipelineRunStepLogs(params: {
  projectName: string;
  pipelineName: string;
  runName: string;
  stepName: string;
}) {
  const url =
    base +
    `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs/${params.runName}/log`;
  return get(url, { params: { step: params.stepName } }).then((res) => res);
}

export function listPipelineContexts(projectName: string, pipelineName: string) {
  const url = base + `/api/v1/projects/${projectName}/pipelines/${pipelineName}/contexts`;
  return get(url, {}).then((res) => res);
}

export function deletePipelineContext(
  projectName: string,
  pipelineName: string,
  contextName: string,
) {
  const url =
    base + `/api/v1/projects/${projectName}/pipelines/${pipelineName}/contexts/${contextName}`;
  return rdelete(url, {}).then((res) => res);
}

export function updatePipelineContext(
  projectName: string,
  pipelineName: string,
  context: {
    name: string;
    values: Array<{ key: string; value: string }>;
  },
) {
  const url =
    base + `/api/v1/projects/${projectName}/pipelines/${pipelineName}/contexts/${context.name}`;
  return put(url, context).then((res) => res);
}

export function loadPipelineRunStepOutputs(params: {
  projectName: string;
  pipelineName: string;
  runName: string;
  stepName: string;
}) {
  const url =
    base +
    `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs/${params.runName}/output`;
  return get(url, { params: { step: params.stepName } }).then((res) => res);
}

export function loadPipelineRunStepInputs(params: {
  projectName: string;
  pipelineName: string;
  runName: string;
  stepName: string;
}) {
  const url =
    base +
    `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs/${params.runName}/input`;
  return get(url, { params: { step: params.stepName } }).then((res) => res);
}

export function createPipelineContext(
  projectName: string,
  pipelineName: string,
  context: {
    name: string;
    values: Array<{ key: string; value: string }>;
  },
) {
  const url = base + `/api/v1/projects/${projectName}/pipelines/${pipelineName}/contexts`;
  return post(url, context).then((res) => res);
}

export function runPipeline(projectName: string, pipelineName: string, contextName?: string) {
  const url = base + `/api/v1/projects/${projectName}/pipelines/${pipelineName}/run`;
  return post(url, contextName ? { contextName } : {}).then((res) => res);
}

export function terminatePipelineRun(params: {
  projectName: string;
  pipelineName: string;
  runName: string;
}) {
  const url =
    base +
    `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs/${params.runName}/terminate`;
  return post(url, {}).then((res) => res);
}

export function resumePipelineRun(params: {
  projectName: string;
  pipelineName: string;
  runName: string;
}) {
  const url =
    base +
    `/api/v1/projects/${params.projectName}/pipelines/${params.pipelineName}/runs/${params.runName}/resume`;
  return post(url, {}).then((res) => res);
}
