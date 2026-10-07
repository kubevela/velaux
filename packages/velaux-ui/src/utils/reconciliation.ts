// RestartPlan is a workflow restart as the restart-workflow annotation and
// status.workflowRestartScheduledAt describe it.
export interface RestartPlan {
  mode: 'none' | 'now' | 'once' | 'every';
  // every is the interval between restarts when recurring.
  every?: string;
  // next is when the restart runs, where it is known.
  next?: Date;
}

const date = (value?: string): Date | undefined => {
  const d = value ? new Date(value) : undefined;
  return d && !isNaN(d.getTime()) ? d : undefined;
};

// restartPlan reads the annotation's value: "true" restarts now, an RFC3339
// time restarts once then, and anything else is an interval between restarts.
// KubeVela's scheduled time, where it has one, is when the next run happens; it
// deletes the annotation of a one-off as it schedules it, leaving only that time.
export function restartPlan(annotation?: string, scheduledAt?: string): RestartPlan {
  if (!annotation) {
    const next = date(scheduledAt);
    return next ? { mode: 'once', next } : { mode: 'none' };
  }
  if (annotation === 'true') {
    return { mode: 'now' };
  }
  const at = date(annotation);
  if (at) {
    return { mode: 'once', next: date(scheduledAt) || at };
  }
  return { mode: 'every', every: annotation, next: date(scheduledAt) };
}
