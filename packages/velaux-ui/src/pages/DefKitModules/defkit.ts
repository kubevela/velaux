import type {
  DefKitRepository,
  DefKitItemStatus,
  DefKitPhase,
  DefKitPolicy,
  DefKitPreviewItem,
  DefKitSettings,
  DefKitSource,
} from '@velaux/data';
import type { Tone } from '../../components/StatusBadge';

export const phaseLabels: Record<DefKitPhase, string> = {
  rendering: 'Rendering',
  review: 'Waiting for review',
  applying: 'Applying',
  applied: 'Applied',
  failed: 'Failed',
};

export const phaseTones: Record<DefKitPhase, Tone> = {
  rendering: 'progressing',
  review: 'suspended',
  applying: 'progressing',
  applied: 'healthy',
  failed: 'failed',
};

// busy phases are polled until they settle.
export function busy(phase?: DefKitPhase): boolean {
  return phase === 'rendering' || phase === 'applying';
}

const kindTypes: Record<string, string> = {
  ComponentDefinition: 'component',
  TraitDefinition: 'trait',
  PolicyDefinition: 'policy',
  WorkflowStepDefinition: 'workflowstep',
};

export const kindLabels: Record<string, string> = {
  ComponentDefinition: 'Components',
  TraitDefinition: 'Traits',
  PolicyDefinition: 'Policies',
  WorkflowStepDefinition: 'Workflow steps',
};

// definitionLink is a definition's page under Definitions.
export function definitionLink(kind: string, name: string): string {
  return `/definitions/${kindTypes[kind] || 'component'}/${name}/doc`;
}

// sourceText is where a module comes from, as one line.
export function sourceText(src: DefKitSource): string {
  const from = src.git || src.ref || '';
  return src.version ? `${from}@${src.version}` : from;
}

// statusOrder is how a preview reads: what the review decides first.
export const statusOrder: DefKitItemStatus[] = ['conflict', 'removed', 'new', 'changed', 'unchanged'];

export const statusLabels: Record<DefKitItemStatus, string> = {
  conflict: 'Already exists, not from this module',
  removed: 'No longer in the module',
  new: 'New',
  changed: 'Changed',
  unchanged: 'Unchanged',
};

// groupPreview splits a preview by status, in statusOrder, leaving out empty groups.
export function groupPreview(
  items: DefKitPreviewItem[]
): Array<{ status: DefKitItemStatus; items: DefKitPreviewItem[] }> {
  return statusOrder
    .map((status) => ({
      status,
      items: items.filter((i) => i.status === status).sort((a, b) => (a.kind + a.name).localeCompare(b.kind + b.name)),
    }))
    .filter((g) => g.items.length > 0);
}

export function itemId(item: { kind: string; name: string }): string {
  return `${item.kind}/${item.name}`;
}

// parseSource reads the dialog's fields: a source that looks like a URL is a
// git repository, anything else a Go module path.
export function parseSource(from: string, version: string, prefix: string, types: string[]): DefKitSource {
  const trimmed = from.trim();
  const isGit = /^(https?:\/\/|git@|ssh:\/\/)/.test(trimmed) || trimmed.endsWith('.git');
  return {
    ...(isGit ? { git: trimmed } : { ref: trimmed }),
    version: version.trim() || undefined,
    prefix: prefix.trim() || undefined,
    types: types.length > 0 ? types : undefined,
  };
}

export const policyLabels: Record<DefKitPolicy, string> = {
  retain: 'Retain',
  delete: 'Delete',
};

// withOverride is settings with one definition's policy set, or with its
// override removed when policy is undefined.
export function withOverride(settings: DefKitSettings, id: string, policy?: DefKitPolicy): DefKitSettings {
  const overrides = { ...(settings.overrides || {}) };
  if (policy) {
    overrides[id] = policy;
  } else {
    delete overrides[id];
  }
  return { ...settings, overrides: Object.keys(overrides).length > 0 ? overrides : undefined };
}

// autoText says how often a module updates itself, or nothing when it does not.
export function autoText(settings: DefKitSettings): string {
  return settings.autoUpdate ? settings.interval || '10m' : '';
}

// minIntervalMs is the shortest auto update interval the server accepts.
export const minIntervalMs = 5 * 60 * 1000;

// durationMs reads a Go duration of hours, minutes and seconds, such as 1h30m,
// or undefined when it is not one.
export function durationMs(value: string): number | undefined {
  const trimmed = value.trim();
  if (!/^([0-9]+(\.[0-9]+)?(h|m|s))+$/.test(trimmed)) {
    return undefined;
  }
  const unit: Record<string, number> = { h: 3600000, m: 60000, s: 1000 };
  let total = 0;
  trimmed.replace(/([0-9]+(?:\.[0-9]+)?)(h|m|s)/g, (_, n: string, u: string) => {
    total += parseFloat(n) * unit[u];
    return '';
  });
  return total;
}

// intervalError is why an auto update interval is refused, as an untranslated
// message, or undefined when it is accepted.
export function intervalError(value: string): string | undefined {
  const ms = durationMs(value || '');
  if (ms === undefined) {
    return 'A duration such as 10m or 1h';
  }
  return ms < minIntervalMs ? 'At least 5m' : undefined;
}

// stepTones colours a workflow step by its phase.
export function stepTone(phase?: string): Tone {
  switch (phase) {
    case 'succeeded':
      return 'healthy';
    case 'failed':
      return 'failed';
    case 'suspending':
      return 'suspended';
    case 'running':
      return 'progressing';
  }
  return 'neutral';
}

const stepLabels: Record<string, string> = {
  succeeded: 'Succeeded',
  failed: 'Failed',
  suspending: 'Suspended',
  running: 'Running',
  skipped: 'Skipped',
  pending: 'Pending',
};

// stepLabel is a workflow step's phase as a translatable label; an unknown phase is shown as it is.
export function stepLabel(phase?: string): string {
  return stepLabels[phase || 'pending'] || (phase as string);
}

// rekeyOverrides moves overrides, keyed Kind/name, from names under one prefix
// to the same names under another; keys without the old prefix are kept.
export function rekeyOverrides(
  overrides: Record<string, DefKitPolicy> | undefined,
  from: string,
  to: string
): Record<string, DefKitPolicy> | undefined {
  if (!overrides || from === to) {
    return overrides;
  }
  const out: Record<string, DefKitPolicy> = {};
  Object.keys(overrides).forEach((key) => {
    const slash = key.indexOf('/');
    const kind = key.slice(0, slash);
    const name = key.slice(slash + 1);
    out[name.startsWith(from) ? `${kind}/${to}${name.slice(from.length)}` : key] = overrides[key];
  });
  return out;
}

// gitCredentials says whether a source is an http(s) URL carrying user info,
// which the server refuses: private repositories are not supported.
export function gitCredentials(from: string): boolean {
  return /^https?:\/\/[^/?#]*@/i.test(from.trim());
}

// Sequence numbers requests so that only the latest reply is used, and none
// once its component has unmounted.
export interface Sequence {
  next: () => number;
  current: (n: number) => boolean;
  start: () => void;
  stop: () => void;
}

export function sequence(): Sequence {
  let last = 0;
  let live = true;
  return {
    next: () => ++last,
    current: (n: number) => live && n === last,
    start: () => {
      live = true;
    },
    stop: () => {
      live = false;
    },
  };
}

// addonMissing is true only when a successful list reply says the defkit addon is not enabled.
export function addonMissing(res?: { addonEnabled?: boolean }): boolean {
  return res?.addonEnabled === false;
}

// apiMessage is the server's message for a failed request, when it sent one.
export function apiMessage(err?: { Message?: string }): string | undefined {
  return err?.Message || undefined;
}

// renderChangedCode is the server's refusal to apply a render other than the one reviewed.
export const renderChangedCode = 23007;

// repositoryOptions are the built-in repositories as the Source field offers
// them: the address to fill in, labelled with the repository's name.
export function repositoryOptions(repos: DefKitRepository[]): Array<{ value: string; label: string }> {
  return repos
    .filter((r) => r.git || r.ref)
    .map((r) => ({ value: (r.git || r.ref) as string, label: `${r.name} · ${r.git || r.ref}` }));
}
