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
  restrictions?: DefinitionRestrictions;
  // unusableIn are the namespaces asked about whose Applications the
  // restrictions keep from using the definition.
  unusableIn?: string[];
}

export interface LabelSelectorRequirement {
  key: string;
  operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
  values?: string[];
}

export interface LabelSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: LabelSelectorRequirement[];
}

// NamespaceQuota caps how many times the namespaces it matches may use a
// definition: warn flags the level, limit refuses beyond it. An entry naming no
// namespaces is the default for every namespace no earlier entry matched.
export interface NamespaceQuota {
  namespaces?: string[];
  namespaceSelector?: LabelSelector;
  warn?: number;
  limit?: number;
}

// DefinitionRestrictions are the namespaces whose Applications may use a
// definition, by name or glob, or by the Namespace's labels, and its quota.
export interface DefinitionRestrictions {
  namespaces?: string[];
  namespaceSelector?: LabelSelector;
  quota?: NamespaceQuota[];
}

// NamespaceUsage is one namespace's use of a definition, counted as the
// Application webhook counts it, against the quota entry governing it.
export interface NamespaceUsage {
  namespace: string;
  used: number;
  warn?: number;
  limit?: number;
  state: 'ok' | 'warn' | 'over' | 'exempt' | 'unlimited';
}

export interface DefinitionUsageResponse {
  usage?: NamespaceUsage[];
}
