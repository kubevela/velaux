// What VelaUX writes on an application for itself, as opposed to what its owner set.

const sourceOfTruth = 'app.oam.dev/source-of-truth';
const fromNamespace = 'ux.oam.dev/from-namespace';
const syncedRevision = 'ux.oam.dev/synced-revision';
const syncedGeneration = 'ux.oam.dev/synced-generation';

// fromCluster is the source of truth of an application synced from its CR.
const fromCluster = 'from-k8s-resource';

// syncedDescription is the description the CR-to-VelaUX sync gives an application.
const syncedDescription = 'Automatically converted from KubeVela Application in Kubernetes.';

// isInternalLabel reports a label VelaUX keeps for its own bookkeeping.
function isInternalLabel(key: string): boolean {
  return key === sourceOfTruth || key.startsWith('ux.oam.dev/');
}

// visibleLabels are an application's own labels, in their order, without
// VelaUX's bookkeeping.
export function visibleLabels(labels?: Record<string, string>): string[] {
  return Object.keys(labels || {}).filter((key) => !isInternalLabel(key));
}

// SyncInfo is what VelaUX's labels say about an application synced from its CR.
export interface SyncInfo {
  fromCluster: boolean;
  namespace?: string;
  revision?: string;
  generation?: string;
}

// syncInfo reads whether an application is synced from the cluster, and from
// where and which revision when it is.
export function syncInfo(labels?: Record<string, string>): SyncInfo {
  const l = labels || {};
  if (l[sourceOfTruth] !== fromCluster) {
    return { fromCluster: false };
  }
  return {
    fromCluster: true,
    namespace: l[fromNamespace],
    revision: l[syncedRevision],
    generation: l[syncedGeneration],
  };
}

// isDefaultDescription reports the description the sync writes, which says
// nothing about the application.
export function isDefaultDescription(description?: string): boolean {
  return description === syncedDescription;
}
