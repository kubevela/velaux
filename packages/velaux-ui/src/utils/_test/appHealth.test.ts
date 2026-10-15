import { expect } from 'chai';

import {
  componentRatio,
  healthOf,
  summariseStatuses,
  workflowLabel,
} from '../../pages/ApplicationList/components/AppStatus/health';

describe('application health', () => {
  it('is not deployed without a status', () => {
    expect(healthOf(undefined)).to.equal('undeployed');
    expect(healthOf({ health: 'unhealthy', components: 2, healthyComponents: 1 })).to.equal('unhealthy');
  });

  it('counts the share of components healthy', () => {
    expect(componentRatio({ health: 'unhealthy', components: 4, healthyComponents: 3 })).to.equal(0.75);
    expect(componentRatio({ health: 'undeployed', components: 0, healthyComponents: 0 })).to.equal(undefined);
  });

  it('writes a workflow phase as a word', () => {
    expect(workflowLabel('executing')).to.equal('Executing');
    expect(workflowLabel(undefined)).to.equal('');
  });
});

describe('summarising per-environment statuses', () => {
  const running = (healthy: boolean[]) => ({
    status: 'running',
    workflow: { status: 'succeeded' },
    services: healthy.map((h) => ({ healthy: h })),
  });

  it('is not deployed with no statuses', () => {
    expect(summariseStatuses([]).health).to.equal('undeployed');
  });

  it('takes the worst environment and counts components across them', () => {
    const s = summariseStatuses([
      { envName: 'dev', status: running([true]) },
      { envName: 'prod', status: { status: 'workflowFailed', workflow: { status: 'failed' }, services: [] } },
    ] as any);
    expect(s.health).to.equal('failed');
    expect(s.workflow).to.equal('failed');
    expect([s.healthyComponents, s.components]).to.deep.equal([1, 1]);
    expect(s.envs?.map((e) => e.health)).to.deep.equal(['healthy', 'failed']);
  });

  it('calls a running environment with an unhealthy component unhealthy', () => {
    expect(summariseStatuses([{ envName: 'dev', status: running([true, false]) }] as any).health).to.equal('unhealthy');
  });
});
