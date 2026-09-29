import type { ComponentStatus } from '@velaux/data';

export interface DetailEntry {
  key: string;
  value: string;
}

// detailEntries lists a status details map sorted by key, since the controller
// writes it from a Go map and the order would otherwise change between refreshes.
export function detailEntries(details?: Record<string, string>): DetailEntry[] {
  return Object.keys(details || {})
    .sort()
    .map((key) => ({ key, value: (details || {})[key] }));
}

export function hasStatusDetails(status: ComponentStatus): boolean {
  return (
    detailEntries(status.details).length > 0 ||
    (status.traits || []).some((trait) => detailEntries(trait.details).length > 0)
  );
}

// componentStatusKey identifies one placement of a component: the same name
// appears once per cluster and namespace it is deployed to.
export function componentStatusKey(status: ComponentStatus): string {
  return [status.cluster, status.namespace, status.name].join('/');
}

// summaryEntries keeps the fields that have a value, joining lists.
export function summaryEntries(fields: Array<[string, string | string[] | undefined]>): DetailEntry[] {
  return fields
    .map(([key, value]) => ({ key, value: Array.isArray(value) ? value.join(', ') : value || '' }))
    .filter((entry) => entry.value !== '');
}

export type TraitState = 'healthy' | 'pending' | 'unhealthy';

// traitState is how a trait reads. A trait waiting for its workload before it
// applies is pending, which KubeVela reports as not yet healthy, so pending wins.
export function traitState(trait: { healthy: boolean; pending?: boolean }): TraitState {
  if (trait.pending) {
    return 'pending';
  }
  return trait.healthy ? 'healthy' : 'unhealthy';
}

// traitStateCircle is the status dot for a trait state.
export const traitStateCircle: Record<TraitState, string> = {
  healthy: 'circle-success',
  pending: 'circle-pending',
  unhealthy: 'circle-failure',
};
