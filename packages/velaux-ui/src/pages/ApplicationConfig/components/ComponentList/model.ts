import type { AppHealth, ComponentDependency } from '@velaux/data';

import type { DependencyItem } from '../../../../utils/dependencies';

// ComponentStatusIn is an env's status, as far as a component's health needs.
export interface ComponentStatusIn {
  envName: string;
  status?: {
    services?: Array<{ name: string; healthy?: boolean; message?: string; cluster?: string; namespace?: string }>;
  };
}

// ComponentEnvironmentHealth is a component's health in one env.
export interface ComponentEnvironmentHealth {
  env: string;
  health: AppHealth;
  message?: string;
}

// componentHealth is a component's health in each env it is deployed to: healthy
// where every placement of it is, unhealthy where any is not. An env where it
// is not placed is left out.
export function componentHealth(component: string, statuses: ComponentStatusIn[]): ComponentEnvironmentHealth[] {
  const result: ComponentEnvironmentHealth[] = [];
  (statuses || []).forEach(({ envName, status }) => {
    const placed = (status?.services || []).filter((s) => s.name === component);
    if (placed.length === 0) {
      return;
    }
    const unhealthy = placed.find((s) => !s.healthy);
    result.push({
      env: envName,
      health: unhealthy ? 'unhealthy' : 'healthy',
      message: unhealthy?.message || placed.find((s) => s.message)?.message,
    });
  });
  return result;
}

// componentDependsOn is what a component depends on: those written in its
// dependsOn or inputs, then those KubeVela inferred from its expressions. A
// component written and inferred at the same placement is listed once, as
// written; a read of it at another placement is listed beside it.
export function componentDependsOn(written: string[] | undefined, items: DependencyItem[]): DependencyItem[] {
  const result: DependencyItem[] = (written || []).map((name) => ({ name, direction: 'outbound' }));
  items
    .filter((d) => d.direction === 'outbound')
    .forEach((d) => {
      const listed = result.find((r) => r.name === d.name && r.where === d.where);
      if (!listed) {
        result.push(d);
      }
    });
  return result;
}

// DependsOnOption is a component offered for another's dependsOn.
export interface DependsOnOption {
  label: string;
  value: string;
  // inferred is set where the component is read already, through an expression.
  inferred?: string;
}

// dependsOnOptions are the components one may depend on: all others except
// those that depend on it already, directly or through others, by a written
// dependsOn or a dependency the Application reports (edges), as each would
// close a cycle. One it already reads is marked, as writing it only makes the
// order explicit.
export function dependsOnOptions(
  components: Array<{ name: string; alias?: string; dependsOn?: string[] }>,
  componentName: string | undefined,
  items: DependencyItem[],
  edges: ComponentDependency[] = []
): DependsOnOption[] {
  const dependents = componentName ? dependentsOf(componentName, components, edges, items) : new Set<string>();
  const reads = items.filter((d) => d.direction === 'outbound' && d.inferred && !d.where);
  return components
    .filter((c) => c.name !== componentName && !dependents.has(c.name))
    .map((c) => {
      const option: DependsOnOption = { label: c.alias ? `${c.alias}(${c.name})` : c.name, value: c.name };
      const read = reads.find((d) => d.name === c.name);
      return read ? { ...option, inferred: read.inferred } : option;
    });
}

// dependentsOf is every component that depends on name, at any distance.
function dependentsOf(
  name: string,
  components: Array<{ name: string; dependsOn?: string[] }>,
  edges: ComponentDependency[],
  items: DependencyItem[]
): Set<string> {
  const dependsOn = new Map<string, Set<string>>();
  const add = (from: string, to: string) => dependsOn.set(from, (dependsOn.get(from) || new Set()).add(to));
  components.forEach((c) => (c.dependsOn || []).forEach((d) => add(c.name, d)));
  edges.forEach((e) => add(e.component, e.dependsOn));
  items.filter((d) => d.direction === 'inbound').forEach((d) => add(d.name, name));
  const found = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    dependsOn.forEach((targets, from) => {
      if (!found.has(from) && Array.from(targets).some((t) => t === name || found.has(t))) {
        found.add(from);
        grew = true;
      }
    });
  }
  return found;
}
