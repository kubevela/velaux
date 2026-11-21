import type { Tone } from '../StatusBadge';

// resourceTone is a resource's status colour from its health's code; neutral
// where the health is unknown or not reported.
export function resourceTone(statusCode?: string): Tone {
  switch (statusCode) {
    case 'Healthy':
      return 'healthy';
    case 'Progressing':
      return 'progressing';
    case 'UnHealthy':
      return 'unhealthy';
  }
  return 'neutral';
}

// podTone is a pod's status colour: its health where the cluster reports one,
// else whether every container is ready.
export function podTone(ready?: string, statusCode?: string): Tone {
  const tone = resourceTone(statusCode);
  if (tone !== 'neutral') {
    return tone;
  }
  if (!ready) {
    return 'neutral';
  }
  const [up, all] = ready.split('/');
  return up === all ? 'healthy' : 'progressing';
}
