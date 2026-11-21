import type { ApplicationSourceStatus, SourceResolution } from '@velaux/data';
import type { Tone } from '../components/StatusBadge';

// sourcePhase is how a source's phase reads: fresh while resolved, stale while
// a refresh fails and the last value is served.
export function sourcePhase(phase?: string): { label: string; tone: Tone } {
  switch (phase) {
    case 'Resolved':
      return { label: 'Fresh', tone: 'healthy' };
    case 'Stale':
      return { label: 'Stale', tone: 'suspended' };
    case 'Failed':
      return { label: 'Failed', tone: 'failed' };
    case 'Unused':
      return { label: 'Unused', tone: 'neutral' };
    default:
      return { label: 'Pending', tone: 'progressing' };
  }
}

// nextExpiry is when the first of a source's cache entries expires.
export function nextExpiry(resolutions?: SourceResolution[]): Date | undefined {
  let next: Date | undefined;
  (resolutions || []).forEach((r) => {
    const at = r.expiresAt ? new Date(r.expiresAt) : undefined;
    if (at && !isNaN(at.getTime()) && (!next || at < next)) {
      next = at;
    }
  });
  return next;
}

// timeLeft is the time before an entry expires, in its largest whole unit
// (with minutes beside hours), or nothing once it has passed: the controller
// refreshes the entry on its next reconcile.
export function timeLeft(at: Date, now: Date = new Date()): string | undefined {
  const seconds = Math.floor((at.getTime() - now.getTime()) / 1000);
  if (seconds <= 0) {
    return undefined;
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
  }
  return `${Math.floor(hours / 24)}d`;
}

// SourceRead is one value a reader took from a source.
export interface SourceRead {
  attr?: string;
  value?: string;
  reader: string;
  readerKind: string;
  readerType?: string;
  property?: string;
  // placement is cluster/namespace, where the read happened.
  placement?: string;
}

// sourceReads lists each value read from a source with who read it and where.
// A reader whose values the binding withholds is listed once, without them.
export function sourceReads(source: Pick<ApplicationSourceStatus, 'name' | 'consumedBy'>): SourceRead[] {
  return (source.consumedBy || []).flatMap((c): SourceRead[] => {
    const reader = {
      reader: c.name,
      readerKind: c.definitionKind,
      readerType: c.type,
      placement: c.cluster || c.namespace ? [c.cluster, c.namespace].filter(Boolean).join('/') : undefined,
    };
    if (!c.values || c.values.length === 0) {
      return [{ attr: undefined, value: undefined, ...reader, property: undefined }];
    }
    return c.values.map((v) => ({
      attr: v.sourceAttr,
      value: v.value === undefined ? undefined : typeof v.value === 'string' ? v.value : JSON.stringify(v.value),
      ...reader,
      property: v.property,
    }));
  });
}
