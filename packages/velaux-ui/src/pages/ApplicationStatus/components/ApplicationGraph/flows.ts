import type { DataFlow, DataFlowEnd } from '@velaux/data';

import type { TreeNode } from '../../../../components/TreeGraph/interface';
import { placementKey } from './sources';

// Placed is a component placement on the graph: its cluster, namespace and name
// (as placementKey splits), and its node key.
interface Placed {
  cluster: string;
  namespace: string;
  name: string;
  key: string;
}

function placedComponents(placements: Map<string, string>): Placed[] {
  const out: Placed[] = [];
  placements.forEach((key, pk) => {
    const [cluster, namespace, name] = pk.split('/');
    out.push({ cluster, namespace, name, key });
  });
  return out;
}

// readers are the placements of the component a flow reaches: the one it names,
// or every placement of it.
function readers(to: DataFlowEnd, placed: Placed[]): Placed[] {
  return placed.filter(
    (p) =>
      p.name === to.name &&
      (!to.cluster || (to.cluster || 'local') === p.cluster) &&
      (!to.namespace || to.namespace === p.namespace)
  );
}

// producerKey is where a flow's data comes from for one reader: a source's node,
// or the producing component at the placement the read names, else beside the
// reader.
function producerKey(
  from: DataFlowEnd,
  reader: Placed,
  placed: Placed[],
  sources: Map<string, string>
): string | undefined {
  if (from.kind === 'source') {
    return sources.get(from.name);
  }
  const cluster = from.cluster || reader.cluster;
  const namespace = from.namespace || (from.cluster ? undefined : reader.namespace);
  const match = placed.find(
    (p) => p.name === from.name && p.cluster === (cluster || 'local') && (!namespace || p.namespace === namespace)
  );
  return match?.key;
}

// flowNodes are a node per flow and reader placement, each fed by its producer
// and feeding its reader. sources maps a source binding's name to its node key.
export function flowNodes(
  flows: DataFlow[],
  placements: Map<string, string>,
  sources: Map<string, string>
): TreeNode[] {
  const placed = placedComponents(placements);
  const nodes: TreeNode[] = [];
  flows.forEach((flow) => {
    readers(flow.to, placed).forEach((reader) => {
      const from = producerKey(flow.from, reader, placed, sources);
      if (!from) {
        return;
      }
      nodes.push({
        nodeType: 'flow',
        resource: {
          name: `${flow.via}:${flow.from.kind}:${flow.from.name}->${placementKey(
            reader.cluster,
            reader.namespace,
            reader.name
          )}`,
          kind: 'DataFlow',
        },
        flow,
        linksFrom: [from],
        links: [reader.key],
      });
    });
  });
  return nodes;
}

// flowLine renders an item as read → property, with the value where one was
// recorded and the trait that read it.
export function flowLine(item: { read: string; property?: string; trait?: string; value?: any }): string {
  let line = item.property ? `${item.read} → ${item.property}` : item.read;
  if (item.value !== undefined && item.value !== null) {
    line += ` = ${typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}`;
  }
  return item.trait ? `${line} (${item.trait})` : line;
}

export const flowLabels: Record<DataFlow['via'], string> = {
  source: 'Source values',
  expression: 'Expressions',
  inputs: 'Outputs to inputs',
  dependsOn: 'Order only',
};
