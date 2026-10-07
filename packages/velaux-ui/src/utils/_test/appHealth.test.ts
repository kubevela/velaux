import { expect } from 'chai';

import {
  byHealth,
  envPhase,
  phaseLabel,
  phaseTone,
  componentRatio,
  healthCounts,
  healthOf,
  pausedEnvs,
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

describe('pausedEnvs', () => {
  it('lists the envs whose reconciliation is paused', () => {
    expect(
      pausedEnvs([
        { envName: 'dev', status: { status: 'running' } },
        { envName: 'prod', status: { status: 'running', paused: true } },
        { envName: 'staging' },
      ])
    ).to.deep.equal(['prod']);
  });
});

describe('health filter', () => {
  const apps = [
    { name: 'a', status: { health: 'healthy' } },
    { name: 'b', status: { health: 'healthy' } },
    { name: 'c', status: { health: 'failed' } },
    { name: 'd' },
  ] as any[];

  it('counts the applications in each health, and all of them', () => {
    expect(healthCounts(apps)).to.deep.equal({ all: 4, healthy: 2, failed: 1, undeployed: 1 });
  });

  it('keeps the applications in the chosen health, all of them for all', () => {
    expect(byHealth(apps, 'healthy').map((a) => a.name)).to.deep.equal(['a', 'b']);
    expect(byHealth(apps, 'undeployed').map((a) => a.name)).to.deep.equal(['d']);
    expect(byHealth(apps, 'all').length).to.equal(4);
  });
});

describe('envPhase', () => {
  it("reads one env's phase, and labels and colours it", () => {
    const statuses = [
      { envName: 'prod', status: { status: 'running' } },
      { envName: 'dev', status: { status: 'workflowFailed' } },
    ];
    expect(envPhase(statuses, 'prod')).to.equal('running');
    expect(envPhase(statuses, 'missing')).to.equal(undefined);
    expect(phaseLabel('running')).to.equal('Running');
    expect(phaseLabel(undefined)).to.equal('Init');
    expect(phaseTone('running')).to.equal('healthy');
    expect(phaseTone('workflowFailed')).to.equal('failed');
    expect(phaseTone('rendering')).to.equal('progressing');
  });
});
