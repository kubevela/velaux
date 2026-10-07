import type { ResourceTreeNode } from '@velaux/data';
import type { StatusTooltipProps } from '../StatusTooltip';
import { summaryEntries } from '../../utils/status';

// resourceTooltip summarises a resource on the graph: what and where it is, its
// health, and for a pod how it is running.
export function resourceTooltip(resource: ResourceTreeNode): StatusTooltipProps {
  const code = resource.healthStatus?.statusCode;
  const info = resource.additionalInfo || {};
  const text = (v: unknown) => (v === undefined || v === null || v === '' ? undefined : String(v));
  const pod = resource.kind === 'Pod';
  return {
    title: resource.name,
    healthy: code === 'Healthy' ? true : code === 'UnHealthy' ? false : undefined,
    progressing: code === 'Progressing',
    summary: summaryEntries([
      ['Kind', resource.kind],
      ['API Version', resource.apiVersion],
      ['Namespace', resource.namespace],
      ['Cluster', resource.cluster],
      ['Status', pod ? text(info.Status) : undefined],
      ['Ready', pod ? text(info.Ready) : undefined],
      ['Restarts', pod ? text(info.Restarts) : undefined],
      ['Age', pod ? text(info.Age) : undefined],
      ['EIP', resource.kind === 'Service' ? text(info.EIP) : undefined],
      ['Reason', text(resource.healthStatus?.reason)],
    ]),
    message: text(resource.healthStatus?.message),
  };
}

// clusterTooltip summarises a cluster on the resource graph.
export function clusterTooltip(name: string): StatusTooltipProps {
  return { title: name, summary: [{ key: 'Kind', value: 'Cluster' }] };
}

// targetTooltip summarises a target, named cluster/namespace, on the service graph.
export function targetTooltip(name: string): StatusTooltipProps {
  const [cluster, namespace] = name.split('/');
  return {
    title: name,
    summary: summaryEntries([
      ['Cluster', cluster],
      ['Namespace', namespace],
    ]),
  };
}

// traitTooltip summarises a trait on the service graph.
export function traitTooltip(trait: {
  type: string;
  healthy: boolean;
  pending?: boolean;
  message?: string;
  details?: Record<string, string>;
}): StatusTooltipProps {
  return {
    title: trait.type,
    healthy: trait.healthy,
    pending: trait.pending,
    summary: [{ key: 'Kind', value: 'Trait' }],
    message: trait.message,
    details: trait.details,
  };
}
