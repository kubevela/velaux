import { expect } from 'chai';

import {
  canMove,
  forwardWaits,
  forwardWaitsIn,
  orderByDependencies,
} from '../../components/PipelineGraph/dependencies';

const names = (steps: Array<{ name: string }>) => steps.map((s) => s.name);

describe('orderByDependencies', () => {
  it('puts each step after everything it waits on, keeping the list order where it can', () => {
    const steps = [
      { name: 'announce', dependsOn: ['smoke'] },
      { name: 'deploy' },
      { name: 'notify', dependsOn: ['deploy'] },
      { name: 'smoke', dependsOn: ['deploy'] },
    ];
    expect(names(orderByDependencies(steps))).to.deep.equal(['deploy', 'notify', 'smoke', 'announce']);
  });
  it('reads an input fed by another step output as waiting on it', () => {
    const steps = [
      { name: 'use', inputs: [{ from: 'image', parameterKey: 'image' }] },
      { name: 'build', outputs: [{ name: 'image', valueFrom: 'x' }] },
    ];
    expect(names(orderByDependencies(steps))).to.deep.equal(['build', 'use']);
  });
  it('leaves an order that already fits alone', () => {
    const steps = [{ name: 'a' }, { name: 'b', dependsOn: ['a'] }, { name: 'c' }];
    expect(names(orderByDependencies(steps))).to.deep.equal(['a', 'b', 'c']);
  });
  it('keeps steps caught in a cycle, in their list order, after the rest', () => {
    const steps = [{ name: 'x', dependsOn: ['y'] }, { name: 'a' }, { name: 'y', dependsOn: ['x'] }];
    expect(names(orderByDependencies(steps))).to.deep.equal(['a', 'x', 'y']);
  });
});

describe('forwardWaits', () => {
  it('finds a step waiting on one listed after it', () => {
    const steps = [{ name: 'a', dependsOn: ['b'] }, { name: 'b' }, { name: 'c', dependsOn: ['a'] }];
    expect(forwardWaits(steps)).to.deep.equal([{ step: 'a', waitsOn: 'b' }]);
  });
});

describe('forwardWaitsIn', () => {
  it('checks the top level in order, and groups in their own mode', () => {
    const steps = [
      { name: 'a', dependsOn: ['b'] },
      { name: 'b' },
      {
        name: 'g',
        type: 'step-group',
        subSteps: [{ name: 's1', dependsOn: ['s2'] }, { name: 's2' }],
      },
      {
        name: 'h',
        type: 'step-group',
        mode: 'StepByStep',
        subSteps: [{ name: 't1', dependsOn: ['t2'] }, { name: 't2' }],
      },
    ];
    expect(forwardWaitsIn(steps, 'StepByStep', 'DAG')).to.deep.equal([
      { step: 'a', waitsOn: 'b' },
      { step: 't1', waitsOn: 't2' },
    ]);
    expect(forwardWaitsIn(steps, 'DAG', 'StepByStep')).to.deep.equal([
      { step: 's1', waitsOn: 's2' },
      { step: 't1', waitsOn: 't2' },
    ]);
  });
});

describe('canMove', () => {
  const steps = [{ name: 'a' }, { name: 'b', dependsOn: ['a'] }, { name: 'c' }];
  it('refuses a move that puts a step before one it waits on', () => {
    expect(canMove(steps, 1, -1)).to.equal(false);
    expect(canMove(steps, 0, 1)).to.equal(false);
  });
  it('allows any other move inside the list', () => {
    expect(canMove(steps, 2, -1)).to.equal(true);
    expect(canMove(steps, 1, 1)).to.equal(true);
    expect(canMove(steps, 0, -1)).to.equal(false);
    expect(canMove(steps, 2, 1)).to.equal(false);
  });
});
