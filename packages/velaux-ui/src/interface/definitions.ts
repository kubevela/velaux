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
  ownerAddon: string;
  workloadType: string;
  category?: string;

  component?: any;
  trait?: {
    definitionRef?: { name: string; version: string };
    podDisruptive: boolean;
    appliesToWorkloads: string[];
  };
  policy?: any;
  workflowStep?: any;
}
