import type { UIParam, WorkflowStepStatus } from './application';

export interface ConfigTemplate {
  name: string;
  namespace: string;
  alias?: string;
  description?: string;
  scope: string;
  sensitive: boolean;
  createTime: string;
}

export interface ConfigTemplateDetail extends ConfigTemplate {
  schema: any;
  uiSchema: UIParam[];
}

export interface ListTemplateResponse {
  templates?: ConfigTemplate[];
}

export interface NamespacedName {
  name: string;
  namespace?: string;
}

export interface CreateConfigRequest extends UpdateConfigRequest {
  name: string;
  template: NamespacedName;
}

export interface UpdateConfigRequest {
  alias?: string;
  description?: string;
  properties: string;
}

export interface Config {
  name: string;
  alias?: string;
  description?: string;
  createdTime: string;
  template: NamespacedName;
  templateAlias?: string;
  sensitive: boolean;
  properties?: Record<string, any>;
  shared: boolean;
  targets?: TargetClusterStatus[];
}

export interface ConfigDistribution {
  name: string;
  createTime: string;
  configs: Array<{ name: string; namespace: string }>;
  targets: TargetCluster[];
  application: { name: string; namespace: string };
  status?: {
    status: string;
    workflow?: {
      steps?: WorkflowStepStatus[];
    };
  };
}

export interface TargetCluster {
  clusterName?: string;
  namespace: string;
}

export interface TargetClusterStatus extends TargetCluster {
  status: string;
  message: string;
}

export interface CreateConfigDistribution {
  name: string;
  targets: TargetCluster[];
  configs: NamespacedName[];
}
