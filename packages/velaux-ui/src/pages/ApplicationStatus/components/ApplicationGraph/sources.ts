import type { Tone } from '../../../../components/StatusBadge';
import type { ApplicationSourceStatus, SourceConsumer } from '@velaux/data';

import type { DependencyItem } from '../../../../utils/dependencies';

// placementKey names a component placement on the graph: its cluster (local
// when unnamed), namespace and name.
export function placementKey(cluster: string | undefined, namespace: string | undefined, name: string): string {
  return `${cluster || 'local'}/${namespace || ''}/${name}`;
}

// readerComponent is the component a reader is, or is attached to: a trait is
// named <component>/<trait>. Workflow steps and policies are not components.
export function readerComponent(consumer: SourceConsumer): string | undefined {
  if (consumer.definitionKind === 'component') {
    return consumer.name;
  }
  if (consumer.definitionKind === 'trait') {
    return consumer.name.split('/')[0];
  }
  return undefined;
}

// SourceLinks are where a source is read on the graph: the component nodes,
// by graph key, and the readers that have no node there.
export interface SourceLinks {
  links: string[];
  elsewhere: SourceConsumer[];
}

// sourceLinks matches a source's readers to the component placements on the
// graph (placementKey to node key). A reader that names no cluster or
// namespace is linked to every placement of its component.
export function sourceLinks(source: ApplicationSourceStatus, placements: Map<string, string>): SourceLinks {
  const links = new Set<string>();
  const elsewhere: SourceConsumer[] = [];
  (source.consumedBy || []).forEach((consumer) => {
    const component = readerComponent(consumer);
    if (!component) {
      elsewhere.push(consumer);
      return;
    }
    const matched: string[] = [];
    placements.forEach((nodeKey, key) => {
      const [cluster, namespace, name] = key.split('/');
      if (
        name === component &&
        (!consumer.cluster || consumer.cluster === cluster) &&
        (!consumer.namespace || consumer.namespace === namespace)
      ) {
        matched.push(nodeKey);
      }
    });
    if (matched.length === 0) {
      elsewhere.push(consumer);
    }
    matched.forEach((k) => links.add(k));
  });
  return { links: Array.from(links), elsewhere };
}

// sourceReads are the sources a component placement reads, as dependency
// items; one read only through a trait says which.
export function sourceReads(
  component: string,
  cluster: string | undefined,
  namespace: string | undefined,
  sources: ApplicationSourceStatus[] | undefined
): DependencyItem[] {
  const items: DependencyItem[] = [];
  (sources || []).forEach((source) => {
    const readers = (source.consumedBy || []).filter(
      (c) =>
        readerComponent(c) === component &&
        (!c.cluster || (c.cluster || 'local') === (cluster || 'local')) &&
        (!c.namespace || c.namespace === (namespace || ''))
    );
    if (readers.length === 0) {
      return;
    }
    const direct = readers.some((r) => r.definitionKind === 'component');
    const traits = readers.filter((r) => r.definitionKind === 'trait').map((r) => r.name.split('/')[1]);
    items.push({
      name: source.name,
      direction: 'outbound',
      kind: 'source',
      type: source.type,
      inferred: direct ? undefined : `Read by its ${traits.join(', ')} trait${traits.length > 1 ? 's' : ''}`,
    });
  });
  return items;
}

// sourcePhaseTone is the status colour of a source's phase.
export function sourcePhaseTone(phase?: string): Tone {
  switch (phase) {
    case 'Resolved':
      return 'healthy';
    case 'Stale':
      return 'suspended';
    case 'Failed':
      return 'failed';
  }
  return 'neutral';
}
