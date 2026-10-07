import type { ComponentDependency } from '@velaux/data';

// Outbound is a component this one depends on; inbound, one that depends on it.
export type DependencyDirection = 'outbound' | 'inbound';

// DependencyItem is one component on either side of a component's dependencies:
// its type, where it is read when that is another placement, and, when KubeVela
// inferred the dependency from a property expression, why.
export interface DependencyItem {
  name: string;
  direction: DependencyDirection;
  type?: string;
  where?: string;
  inferred?: string;
}

// dependencyItems lists what a component depends on, then what depends on it,
// as the server reports them for the deployed Application. A component is
// listed once per direction, a written dependency winning over an inferred one.
// The placement an expression names is where the dependency is read, so only
// outbound items carry it; an inbound item's reason still names it.
export function dependencyItems(
  component: string,
  dependencies?: ComponentDependency[] | null,
  types: Record<string, string> = {}
): DependencyItem[] {
  const items: DependencyItem[] = [];
  const add = (item: DependencyItem) => {
    if (!items.some((i) => i.name === item.name && i.direction === item.direction && i.where === item.where)) {
      const type = types[item.name];
      items.push(type ? { ...item, type } : item);
    }
  };
  const written = (dependencies || []).filter((d) => d.source !== 'expression');
  const inferred = (dependencies || []).filter((d) => d.source === 'expression');
  written.filter((d) => d.component === component).forEach((d) => add({ name: d.dependsOn, direction: 'outbound' }));
  inferred.filter((d) => d.component === component).forEach((d) => add(outboundInferred(d)));
  written.filter((d) => d.dependsOn === component).forEach((d) => add({ name: d.component, direction: 'inbound' }));
  inferred
    .filter((d) => d.dependsOn === component)
    .forEach((d) => add({ name: d.component, direction: 'inbound', inferred: inferredReason(d) }));
  return items;
}

// placement is where an expression reads a component, as it named it: a
// cluster, a cluster and namespace, or a namespace of the reader's own cluster.
function placement(d: ComponentDependency): string {
  if (d.cluster) {
    return d.namespace ? `${d.cluster}/${d.namespace}` : d.cluster;
  }
  return d.namespace ? `namespace ${d.namespace}` : '';
}

function inferredReason(d: ComponentDependency): string {
  const where = placement(d);
  if (!where) {
    return `Inferred from an expression: ${d.component} reads ${d.dependsOn} beside it, so it is applied once ${d.dependsOn} is healthy there`;
  }
  return `Inferred from an expression: ${d.component} reads ${d.dependsOn} in ${where}. Not ordered automatically; the workflow decides when`;
}

function outboundInferred(d: ComponentDependency): DependencyItem {
  const where = placement(d);
  const item: DependencyItem = { name: d.dependsOn, direction: 'outbound', inferred: inferredReason(d) };
  return where ? { ...item, where } : item;
}
