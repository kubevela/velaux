import { expect } from 'chai';

import { conditionMode, isCondition, switchCondition } from '../../components/WorkflowStudio/condition';
import { conditionScope } from '../../components/WorkflowStudio/step-scope';

describe('isCondition', () => {
  it('takes a whole $( ) expression as a condition', () => {
    expect(isCondition('$(source.cfg.on)')).to.equal(true);
    expect(isCondition('  $(steps.a.succeeded && each.index == 0)  ')).to.equal(true);
    expect(isCondition('$(f("(") == ")")')).to.equal(true);
  });

  it('leaves anything else as CUE', () => {
    expect(isCondition(undefined)).to.equal(false);
    expect(isCondition('')).to.equal(false);
    expect(isCondition('always')).to.equal(false);
    expect(isCondition('status.apply.succeeded')).to.equal(false);
    expect(isCondition('context.name == "$(x)"')).to.equal(false);
    expect(isCondition('$(a) && $(b)')).to.equal(false);
    expect(isCondition('$$(a)')).to.equal(false);
    expect(isCondition('$(unclosed')).to.equal(false);
  });
});

describe('conditionMode', () => {
  it('opens an if in the mode its value is in', () => {
    expect(conditionMode('$(source.cfg.on)')).to.equal('expression');
    expect(conditionMode('status.apply.succeeded')).to.equal('cue');
    expect(conditionMode(undefined)).to.equal('cue');
  });
});

describe('switchCondition', () => {
  it('starts an empty expression and clears one left empty', () => {
    expect(switchCondition('', 'expression')).to.equal('$()');
    expect(switchCondition(undefined, 'expression')).to.equal('$()');
    expect(switchCondition('$()', 'cue')).to.equal('');
  });

  it('keeps anything else as written', () => {
    expect(switchCondition('status.apply.succeeded', 'expression')).to.equal('status.apply.succeeded');
    expect(switchCondition('$(source.cfg.on)', 'cue')).to.equal('$(source.cfg.on)');
  });
});

describe('conditionScope', () => {
  const steps = [
    { name: 'names', type: 'make-names', outputs: [{ name: 'list', valueFrom: 'names' }] },
    {
      name: 'rollout',
      type: 'step-group',
      forEach: { items: [{ region: 'eu' }] },
      subSteps: [{ name: 'deploy', type: 'deploy' }],
    },
    { name: 'canary', type: 'deploy', forEach: { items: ['a', 'b'] } },
  ];

  it("gives a looping group's sub-step each, over the group's items", () => {
    const scope = conditionScope(steps, 'deploy');
    expect(scope.condition).to.equal(true);
    expect(scope.loopBody).to.equal(true);
    expect(scope.forEachItems).to.deep.equal([{ region: 'eu' }]);
  });

  it("gives a top-level step's own if no each, even when it loops", () => {
    for (const name of ['canary', 'rollout', 'names']) {
      const scope = conditionScope(steps, name);
      expect(scope.condition).to.equal(true);
      expect(scope.loopBody).to.equal(undefined);
      expect(scope.forEachItems).to.equal(undefined);
    }
  });

  it("lists the workflow's steps, a group's under it", () => {
    expect(conditionScope(steps, 'canary').steps?.map((s) => s.name)).to.deep.equal(['names', 'rollout', 'canary']);
    expect(conditionScope(steps, 'canary').steps?.[1].subSteps?.map((s) => s.name)).to.deep.equal(['deploy']);
  });
});
