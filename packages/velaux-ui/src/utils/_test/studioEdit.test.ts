import { expect } from 'chai';

import { addPreview, insertAfter, studioUpdate } from '../../components/WorkflowStudio/edit';

type S = {
  name: string;
  type: string;
  dependsOn?: string[];
  inputs?: Array<{ from: string; parameterKey: string }>;
  outputs?: Array<{ name: string; valueFrom: string }>;
};

const steps: S[] = [
  { name: 'deploy', type: 'deploy' },
  { name: 'migrate', type: 'suspend', dependsOn: ['deploy'] },
  { name: 'canary', type: 'suspend', dependsOn: ['migrate'] },
  { name: 'notify', type: 'suspend', dependsOn: ['migrate', 'deploy'] },
  { name: 'reads', type: 'suspend', inputs: [{ from: 'migrated', parameterKey: 'x' }] },
];
const added: S = { name: 'backup', type: 'suspend' };

describe('insertAfter', () => {
  it("puts the step in the middle in parallel: it waits on the anchor, and the anchor's dependants wait on it", () => {
    const out = insertAfter(steps, 'migrate', added, { mode: 'DAG', branch: false });
    expect(out.map((s) => s.name)).to.deep.equal(['deploy', 'migrate', 'backup', 'canary', 'notify', 'reads']);
    expect(out.find((s) => s.name === 'backup')?.dependsOn).to.deep.equal(['migrate']);
    expect(out.find((s) => s.name === 'canary')?.dependsOn).to.deep.equal(['backup']);
    expect(out.find((s) => s.name === 'notify')?.dependsOn).to.deep.equal(['backup', 'deploy']);
  });
  it('adds a branch that nothing waits on', () => {
    const out = insertAfter(steps, 'migrate', added, { mode: 'DAG', branch: true });
    expect(out.find((s) => s.name === 'backup')?.dependsOn).to.deep.equal(['migrate']);
    expect(out.find((s) => s.name === 'canary')?.dependsOn).to.deep.equal(['migrate']);
  });
  it('places the step straight after the anchor in order, adding no dependsOn of its own', () => {
    const out = insertAfter(steps, 'deploy', added, { mode: 'StepByStep', branch: false });
    expect(out.map((s) => s.name).slice(0, 3)).to.deep.equal(['deploy', 'backup', 'migrate']);
    expect(out.find((s) => s.name === 'backup')?.dependsOn).to.equal(undefined);
    expect(out.find((s) => s.name === 'migrate')?.dependsOn).to.deep.equal(['backup']);
  });
  it('leaves a step that waits only through its inputs alone', () => {
    const out = insertAfter(steps, 'migrate', added, { mode: 'DAG', branch: false });
    expect(out.find((s) => s.name === 'reads')).to.deep.equal(steps[4]);
  });
  it('keeps the dependsOn the new step was given, in place of the anchor', () => {
    const given: S = { name: 'backup', type: 'suspend', dependsOn: ['deploy'] };
    const out = insertAfter(steps, 'migrate', given, { mode: 'DAG', branch: false });
    expect(out.find((s) => s.name === 'backup')?.dependsOn).to.deep.equal(['deploy']);
    expect(out.find((s) => s.name === 'canary')?.dependsOn).to.deep.equal(['backup']);
  });
  it('appends with no dependencies when there is no anchor', () => {
    const out = insertAfter(steps, undefined, added, { mode: 'DAG', branch: false });
    expect(out[out.length - 1]).to.deep.equal(added);
  });
});

describe('addPreview', () => {
  it('moves the dependsOn waiters after a new step, leaving input-only waiters on the anchor', () => {
    const withReader: S[] = [
      ...steps.slice(0, 4),
      { name: 'reads', type: 'suspend', inputs: [{ from: 'out', parameterKey: 'x' }] },
    ];
    withReader[1] = { ...withReader[1], outputs: [{ name: 'out', valueFrom: 'v' }] } as S;
    expect(addPreview(withReader, 'migrate', 'step', 'DAG')).to.deep.equal({
      moved: ['canary', 'notify'],
      stay: ['reads'],
    });
  });
  it('leaves every waiter on the anchor for a branch', () => {
    expect(addPreview(steps, 'migrate', 'branch', 'DAG')).to.deep.equal({ moved: [], stay: ['canary', 'notify'] });
  });
  it('in order, moves the next step in the list after the new one', () => {
    const chain: S[] = [
      { name: 'a', type: 's' },
      { name: 'b', type: 's' },
      { name: 'c', type: 's' },
    ];
    expect(addPreview(chain, 'a', 'step', 'StepByStep')).to.deep.equal({ moved: ['b'], stay: [] });
    expect(addPreview(chain, 'c', 'step', 'StepByStep')).to.deep.equal({ moved: [], stay: [] });
  });
});

describe('studioUpdate', () => {
  const own: S[] = [
    { name: 'b', type: 's', dependsOn: ['a'] },
    { name: 'a', type: 's' },
  ];
  const shared: S[] = [
    { name: 'x', type: 's' },
    { name: 'y', type: 's', dependsOn: ['x'] },
  ];

  it('takes new steps as given', () => {
    const out = studioUpdate({ steps: own, mode: 'DAG' }, { steps: shared, mode: 'DAG' }, own);
    expect(out?.steps.map((s) => s.name)).to.deep.equal(['x', 'y']);
    expect(out?.changed).to.equal(false);
  });
  it('takes new steps before ordering them when the mode turns to in order with them', () => {
    const reversed: S[] = [shared[1], shared[0]];
    const out = studioUpdate({ steps: own, mode: 'DAG' }, { steps: reversed, mode: 'StepByStep' }, own);
    expect(out?.steps.map((s) => s.name)).to.deep.equal(['x', 'y']);
    expect(out?.changed).to.equal(true);
  });
  it('orders the current steps when only the mode turns to in order', () => {
    const out = studioUpdate({ steps: own, mode: 'DAG' }, { steps: own, mode: 'StepByStep' }, own);
    expect(out?.steps.map((s) => s.name)).to.deep.equal(['a', 'b']);
    expect(out?.changed).to.equal(true);
  });
  it('never reorders read-only steps, which belong to a shared workflow', () => {
    const reversed: S[] = [shared[1], shared[0]];
    const out = studioUpdate({ steps: own, mode: 'DAG' }, { steps: reversed, mode: 'StepByStep', readOnly: true }, own);
    expect(out?.steps.map((s) => s.name)).to.deep.equal(['y', 'x']);
    expect(out?.changed).to.equal(false);
  });
  it('does nothing when nothing changed', () => {
    expect(studioUpdate({ steps: own, mode: 'DAG' }, { steps: own, mode: 'DAG' }, own)).to.equal(undefined);
  });
});
