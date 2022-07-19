export interface DefinitionType {
  type: string;
}

export interface DefinitionMenuType {
  name: string;
  type: string;
}

export interface DefinitionBase {
  name: string;
  alias?: string;
  description?: string;
  icon?: string;
  status: string;
  labels: Record<string, string>;
  component: any;
  workloadType: string;
}
