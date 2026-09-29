import type { DefinitionRestrictions, LabelSelector, NamespaceQuota, NamespaceUsage } from '@velaux/data';

// restrictsNamespaces reports whether a definition limits which namespaces may
// use it. A block carrying only a quota limits none.
export function restrictsNamespaces(r?: DefinitionRestrictions): boolean {
  return !!r && ((r.namespaces || []).length > 0 || r.namespaceSelector !== undefined);
}

// describeSelector words a label selector as KubeVela matches it against the
// Namespace. An empty selector matches every namespace.
export function describeSelector(selector: LabelSelector): string {
  const labels = Object.keys(selector.matchLabels || {})
    .sort()
    .map((key) => `${key}=${(selector.matchLabels || {})[key]}`);
  const expressions = (selector.matchExpressions || []).map((e) => {
    switch (e.operator) {
      case 'In':
        return `${e.key} in (${(e.values || []).join(', ')})`;
      case 'NotIn':
        return `${e.key} not in (${(e.values || []).join(', ')})`;
      case 'Exists':
        return `${e.key} present`;
      default:
        return `${e.key} absent`;
    }
  });
  const terms = [...labels, ...expressions];
  return terms.length === 0 ? 'every namespace' : `labels ${terms.join(', ')}`;
}

// describeNamespaces lists who may use a definition: each name or glob, then
// the selector. Either matching is enough.
export function describeNamespaces(r?: DefinitionRestrictions): string[] {
  if (!restrictsNamespaces(r)) {
    return [];
  }
  const selector = r?.namespaceSelector ? [describeSelector(r.namespaceSelector)] : [];
  return [...(r?.namespaces || []), ...selector];
}

function describeMatcher(q: NamespaceQuota, only: boolean): string {
  const names = q.namespaces || [];
  if (names.length === 0 && !q.namespaceSelector) {
    return only ? 'every namespace' : 'any other namespace';
  }
  const selector = q.namespaceSelector ? [describeSelector(q.namespaceSelector)] : [];
  return [...names, ...selector].join(' or ');
}

function describeLevels(q: NamespaceQuota): string {
  if (q.limit === 0) {
    return 'not allowed';
  }
  const levels = [
    ...(q.warn !== undefined ? [`warn at ${q.warn}`] : []),
    ...(q.limit !== undefined ? [`limit ${q.limit}`] : []),
  ];
  return levels.join(', ');
}

// describeQuota lists a definition's quota entries in the order KubeVela tries
// them, the first match governing a namespace.
export function describeQuota(r?: DefinitionRestrictions): string[] {
  const quota = r?.quota || [];
  return quota.map((q) => `${describeMatcher(q, quota.length === 1)}: ${describeLevels(q)}`);
}

// DeployTarget is what a picker needs of an environment an application deploys
// to: its name and the namespace the Application is created in.
export interface DeployTarget {
  name: string;
  alias?: string;
  appDeployNamespace: string;
}

// deployNamespaces lists the namespaces an application's Applications live in,
// the ones a definition's restrictions are checked against.
export function deployNamespaces(envs?: DeployTarget[]): string[] {
  return Array.from(new Set((envs || []).map((env) => env.appDeployNamespace).filter((ns) => !!ns))).sort();
}

// isUsable reports whether a definition's restrictions let every namespace it
// was asked about use it. Type pickers show only these.
export function isUsable(def: { unusableIn?: string[] }): boolean {
  return (def.unusableIn || []).length === 0;
}

// usageState words how a namespace's use of a definition compares with its
// quota, with the tone to show it in.
export function usageState(state: NamespaceUsage['state']): {
  label: string;
  type: 'success' | 'warning' | 'error' | 'normal';
} {
  switch (state) {
    case 'ok':
      return { label: 'Within quota', type: 'success' };
    case 'warn':
      return { label: 'At warn level', type: 'warning' };
    case 'over':
      return { label: 'Over limit', type: 'error' };
    case 'exempt':
      return { label: 'Exempt', type: 'normal' };
    default:
      return { label: 'No quota', type: 'normal' };
  }
}
