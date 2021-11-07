export interface AppPlanDetail {
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
  status: string;
  resourceInfo: {
    componentNum: Number;
  };
  envBind: Array<EnvBind>;
  workflowStatus?: Array<WorkflowStatus>;
}

export interface EnvBind {
  name: string;
  alias?: string;
  description?: string;
  clusterSelector?: {
    name: string;
    namespace?: string;
  };
  componentSelector?: {
    components: Array<string>;
  };
}

export interface WorkflowStatus {
  name: string;
  status?: string;
  takeTime?: string;
}

export interface AppPlanBase {
  name: string;
  alias: string;
  btnContent?: string;
  status: string;
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
  subParameterGroupOption?: Array<Array<string>>;
  subParameters?: Array<UIParam>;
  validate: UIParamValidate;
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
