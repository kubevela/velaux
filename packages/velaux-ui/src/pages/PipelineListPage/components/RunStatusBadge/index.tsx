import React from 'react';

import type { Tone } from '../../../../components/StatusBadge';
import { StatusBadge } from '../../../../components/StatusBadge';

// RunStatusBadge shows a pipeline run's phase as a StatusBadge.
export const RunStatusBadge = (props: { status?: string }) => (
  <StatusBadge tone={runTone(props.status)} label={runLabel(props.status)} />
);

// runTone colours a pipeline run by its phase.
function runTone(phase?: string): Tone {
  switch (phase) {
    case 'succeeded':
      return 'healthy';
    case 'failed':
    case 'terminated':
      return 'failed';
    case 'suspending':
      return 'suspended';
    case 'executing':
    case 'initializing':
      return 'progressing';
    default:
      return 'neutral';
  }
}

// runLabel writes a run's phase as a word: "succeeded" to "Succeeded".
function runLabel(phase?: string): string {
  return phase ? phase.charAt(0).toUpperCase() + phase.slice(1) : 'Unknown';
}
