import { expect } from 'chai';

import type { WorkflowStepStatus } from '@velaux/data';

import {
  describeItems,
  itemLabel,
  laneSpec,
  loopLanes,
  loopProgress,
  withLoops,
} from '../../components/PipelineGraph/loop';

describe('itemLabel', () => {
  it('names an object by its name, a scalar by itself, anything else by its place', () => {
    expect(itemLabel({ name: 'east', cluster: 'prod-us-east' }, 0)).to.equal('east');
    expect(itemLabel('west', 1)).to.equal('west');
    expect(itemLabel(3, 2)).to.equal('3');
    expect(itemLabel({ cluster: 'prod-eu-1' }, 2)).to.equal('#2');
    expect(itemLabel({ name: 7 }, 4)).to.equal('#4');
    expect(itemLabel(null, 5)).to.equal('#5');
  });
});

const rolloutSpec = {
  name: 'rollout',
  type: 'step-group',
  forEach: { items: [{ name: 'east' }, { name: 'west' }, { name: 'eu' }] },
  subSteps: [
    { name: 'deploy', type: 'deploy', alias: 'Deploy to region' },
    { name: 'approve', type: 'suspend', dependsOn: ['deploy'] },
  ],
};

const rolloutRun = {
  id: 'r',
  name: 'rollout',
  alias: '',
  type: 'step-group',
  phase: 'suspending' as const,
  loop: { mode: 'StepByStep' as const, items: [{ name: 'east' }, { name: 'west' }, { name: 'eu' }] },
  subSteps: [
    {
      id: 'a',
      name: 'rollout-0-deploy',
      alias: 'Deploy to region',
      type: 'deploy',
      phase: 'succeeded' as const,
      iteration: 0,
    },
    {
      id: 'b',
      name: 'rollout-0-approve',
      alias: 'approve',
      type: 'suspend',
      phase: 'succeeded' as const,
      iteration: 0,
    },
    {
      id: 'c',
      name: 'rollout-1-deploy',
      alias: 'Deploy to region',
      type: 'deploy',
      phase: 'succeeded' as const,
      iteration: 1,
    },
    {
      id: 'd',
      name: 'rollout-1-approve',
      alias: 'approve',
      type: 'suspend',
      phase: 'suspending' as const,
      iteration: 1,
    },
  ],
};

describe('loopLanes', () => {
  it('gives each item a lane holding its passes', () => {
    const lanes = loopLanes(rolloutRun, rolloutSpec);
    expect(lanes.map((l) => [l.index, l.label])).to.deep.equal([
      [0, 'east'],
      [1, 'west'],
      [2, 'eu'],
    ]);
    expect(lanes[1].passes.map((p) => p.name)).to.deep.equal(['rollout-1-deploy', 'rollout-1-approve']);
  });

  it('draws an item the loop has not reached from the body, as not started', () => {
    const eu = loopLanes(rolloutRun, rolloutSpec)[2];
    expect(eu.passes.map((p) => [p.name, p.alias, p.type, p.phase])).to.deep.equal([
      ['rollout-2-deploy', 'Deploy to region', 'deploy', undefined],
      ['rollout-2-approve', 'approve', 'suspend', undefined],
    ]);
  });

  it("names a single looped step's passes <loop>-<index>", () => {
    const lanes = loopLanes(
      {
        id: 'x',
        name: 'deploy',
        alias: 'Deploy',
        type: 'deploy',
        phase: 'running',
        loop: { mode: 'DAG', items: ['east', 'west'] },
        subSteps: [{ id: 'y', name: 'deploy-0', alias: 'Deploy', type: 'deploy', phase: 'running', iteration: 0 }],
      },
      { name: 'deploy', type: 'deploy', alias: 'Deploy', forEach: { items: ['east', 'west'] } }
    );
    expect(lanes.map((l) => l.passes.map((p) => [p.name, p.phase]))).to.deep.equal([
      [['deploy-0', 'running']],
      [['deploy-1', undefined]],
    ]);
  });

  it('titles a pass with no alias after the body step it repeats', () => {
    const lanes = loopLanes(
      {
        id: 'x',
        name: 'smoke',
        alias: '',
        type: 'suspend',
        loop: { mode: 'DAG', items: ['east'] },
        subSteps: [{ id: 'y', name: 'smoke-0', alias: '', type: 'suspend', phase: 'succeeded', iteration: 0 }],
      },
      { name: 'smoke', type: 'suspend', alias: 'Smoke test', forEach: { items: ['east'] } }
    );
    const grouped = loopLanes({ ...rolloutRun, subSteps: [{ ...rolloutRun.subSteps[0], alias: '' }] }, rolloutSpec);
    expect([lanes[0].passes[0].alias, grouped[0].passes[0].alias]).to.deep.equal(['Smoke test', 'Deploy to region']);
  });

  it('has no lanes before the loop resolves its items, and keeps passes it cannot place', () => {
    expect(loopLanes({ ...rolloutRun, loop: { mode: 'StepByStep' }, subSteps: [] }, rolloutSpec)).to.deep.equal([]);
    const lanes = loopLanes({ ...rolloutRun, loop: { mode: 'StepByStep' } }, rolloutSpec);
    expect(lanes.map((l) => l.label)).to.deep.equal(['#0', '#1']);
  });
});

describe('loopLanes, keyed', () => {
  const keyedRun = {
    ...rolloutRun,
    loop: { mode: 'StepByStep' as const, items: rolloutRun.loop.items, labels: ['us-east', 'us-west', 'eu'] },
    subSteps: rolloutRun.subSteps.map((p) => ({
      ...p,
      name: p.name.replace('-0-', '-us-east-').replace('-1-', '-us-west-'),
    })),
  };
  it('labels each lane with its key', () => {
    expect(loopLanes(keyedRun, rolloutSpec).map((l) => l.label)).to.deep.equal(['us-east', 'us-west', 'eu']);
  });
  it('names the passes of a lane not reached yet by its key', () => {
    expect(loopLanes(keyedRun, rolloutSpec)[2].passes.map((p) => p.name)).to.deep.equal([
      'rollout-eu-deploy',
      'rollout-eu-approve',
    ]);
  });
  it('titles a keyed pass after its body step', () => {
    const run = { ...keyedRun, subSteps: [{ ...keyedRun.subSteps[0], alias: '' }] };
    expect(loopLanes(run, rolloutSpec)[0].passes[0].alias).to.equal('Deploy to region');
  });
});

describe('laneSpec', () => {
  it("renames the body to a lane's passes, so its edges match them", () => {
    expect(laneSpec('rollout', '1', rolloutSpec.subSteps)).to.deep.equal([
      { name: 'rollout-1-deploy', type: 'deploy', alias: 'Deploy to region' },
      { name: 'rollout-1-approve', type: 'suspend', dependsOn: ['rollout-1-deploy'] },
    ]);
  });
});

describe('loopProgress', () => {
  it('reads each lane as one segment, and counts the items done', () => {
    const progress = loopProgress(loopLanes(rolloutRun, rolloutSpec));
    expect(progress.segments.map((s) => [s.label, s.tone])).to.deep.equal([
      ['east', 'healthy'],
      ['west', 'progressing'],
      ['eu', 'neutral'],
    ]);
    expect([progress.done, progress.total]).to.deep.equal([1, 3]);
  });

  it('marks a lane failed when any of its passes failed', () => {
    const failed = {
      ...rolloutRun,
      subSteps: [{ ...rolloutRun.subSteps[0], phase: 'failed' as const }],
    };
    expect(loopProgress(loopLanes(failed, rolloutSpec)).segments[0].tone).to.equal('failed');
  });
});

describe('describeItems', () => {
  it('lists typed-in items by label, a few at a time', () => {
    expect(describeItems({ items: ['a', 'b', 'c', 'd', 'e', 'f'] })).to.deep.equal({
      source: 'list',
      chips: ['a', 'b', 'c', 'd'],
      more: 2,
      count: 6,
    });
  });
  it('names the variable or expression the items come from', () => {
    expect(describeItems({ from: 'regions' })).to.deep.equal({ source: 'from', chips: ['regions'], more: 0 });
    expect(describeItems({ items: '$(source.platform.regions)' })).to.deep.equal({
      source: 'expression',
      chips: ['$(source.platform.regions)'],
      more: 0,
    });
  });
});

describe('withLoops', () => {
  it("gives a pipeline run's loop steps their loop, and each pass its item", () => {
    const steps: WorkflowStepStatus[] = [
      { id: 's', name: 'shared', alias: '', type: 'deploy', phase: 'succeeded' as const },
      {
        id: 'r',
        name: 'rollout',
        alias: '',
        type: 'step-group',
        phase: 'running' as const,
        subSteps: [{ id: 'a', name: 'rollout-0-deploy', alias: '', type: 'deploy', phase: 'running' as const }],
      },
    ];
    const merged = withLoops(steps, {
      rollout: {
        mode: 'StepByStep',
        items: ['east', 'west'],
        labels: ['e', 'w'],
        iterations: { 'rollout-0-deploy': 0 },
      },
    });
    expect(merged[0]).to.equal(steps[0]);
    expect(merged[1].loop).to.deep.equal({ mode: 'StepByStep', items: ['east', 'west'], labels: ['e', 'w'] });
    expect(merged[1].subSteps?.[0].iteration).to.equal(0);
  });
  it('leaves the steps as they are without loops', () => {
    const steps: WorkflowStepStatus[] = [
      { id: 's', name: 'shared', alias: '', type: 'deploy', phase: 'succeeded' as const },
    ];
    expect(withLoops(steps, undefined)).to.equal(steps);
  });
});
