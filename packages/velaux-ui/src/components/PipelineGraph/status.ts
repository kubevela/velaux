import moment from 'moment';

import type { Tone } from '../StatusBadge';
import { timeDiff } from '../../utils/common';

// recordStatus is how a workflow run's or step's phase shows: its badge's
// tone and label.
export function recordStatus(phase?: string): { tone: Tone; label: string } {
  switch (phase) {
    case 'succeeded':
      return { tone: 'healthy', label: 'Succeeded' };
    case 'failed':
      return { tone: 'failed', label: 'Failed' };
    case 'terminated':
    case 'stopped':
      return { tone: 'failed', label: 'Terminated' };
    case 'suspending':
      return { tone: 'progressing', label: 'Waiting for approval' };
    case 'skipped':
      return { tone: 'neutral', label: 'Skipped' };
    case 'pending':
      return { tone: 'neutral', label: 'Pending' };
    case 'running':
    case 'executing':
    case 'initializing':
      return { tone: 'progressing', label: 'Running' };
    default:
      return { tone: 'neutral', label: phase ? phase[0].toUpperCase() + phase.slice(1) : 'Unknown' };
  }
}

type StepLike = {
  phase?: string;
  message?: string;
  reason?: string;
  firstExecuteTime?: string;
  lastExecuteTime?: string;
};

// stepStatus is a step's badge: its phase, or "Not started" before the run
// reaches it.
export function stepStatus(step: StepLike): { tone: Tone; label: string } {
  return step.phase ? recordStatus(step.phase) : { tone: 'neutral', label: 'Not started' };
}

// stepReached is whether the run has started the step.
export function stepReached(step: StepLike): boolean {
  return !!step.phase && step.phase !== 'pending';
}

const clock = (time: string) => moment(time).format('HH:mm:ss');

// stepCaption is the line under a step's type: why it failed, when it started
// waiting or running, or how long it took and when it started.
export function stepCaption(step: StepLike, time: (iso: string) => string = clock): { text: string; error: boolean } {
  switch (step.phase) {
    case 'failed':
    case 'terminated':
    case 'stopped':
      return { text: step.message || step.reason || '', error: true };
    case 'suspending':
    case 'running':
    case 'executing':
      return { text: step.firstExecuteTime ? `since ${time(step.firstExecuteTime)}` : '', error: false };
    case undefined:
    case '':
    case 'pending':
      return { text: '', error: false };
    default:
      if (!step.firstExecuteTime) {
        return { text: step.message || '', error: false };
      }
      return {
        text: `${timeDiff(step.firstExecuteTime, step.lastExecuteTime)} · ${time(step.firstExecuteTime)}`,
        error: false,
      };
  }
}
