import { expect } from 'chai';

import { restartPlan } from '../reconciliation';

describe('restartPlan', () => {
  it('is nothing without a restart', () => {
    expect(restartPlan(undefined, undefined)).to.deep.equal({ mode: 'none' });
  });

  it('reads "true" as a restart about to run', () => {
    expect(restartPlan('true', undefined)).to.deep.equal({ mode: 'now' });
  });

  it('reads a time as a one-off restart then', () => {
    const plan = restartPlan('2026-10-01T20:00:00Z', undefined);
    expect(plan.mode).to.equal('once');
    expect(plan.next?.toISOString()).to.equal('2026-10-01T20:00:00.000Z');
  });

  it('reads an interval as recurring, next when KubeVela scheduled it', () => {
    const plan = restartPlan('1h', '2026-10-01T21:00:00Z');
    expect(plan.mode).to.equal('every');
    expect(plan.every).to.equal('1h');
    expect(plan.next?.toISOString()).to.equal('2026-10-01T21:00:00.000Z');
  });

  it('prefers the scheduled time KubeVela reports for a one-off', () => {
    const plan = restartPlan('2026-10-01T20:00:00Z', '2026-10-01T20:00:01Z');
    expect(plan.next?.toISOString()).to.equal('2026-10-01T20:00:01.000Z');
  });
});

describe('restartPlan, once KubeVela has taken the annotation', () => {
  it('reads a scheduled time with no annotation as a one-off still to run', () => {
    const plan = restartPlan(undefined, '2026-10-01T20:00:00Z');
    expect(plan.mode).to.equal('once');
    expect(plan.next?.toISOString()).to.equal('2026-10-01T20:00:00.000Z');
  });
});
