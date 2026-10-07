import { expect } from 'chai';

import { groupMode, groupOpensItself, runMode, stepEdges } from '../../components/PipelineGraph/dependencies';

const names = (...n: string[]) => n.map((name) => ({ name }));
const pairs = (edges: Array<{ from: string; to: string }>) => edges.map((e) => `${e.from}>${e.to}`).sort();

describe('runMode', () => {
  it('reads the steps mode from a run mode', () => {
    expect(runMode('DAG-StepByStep')).to.equal('DAG');
    expect(runMode('StepByStep-DAG')).to.equal('StepByStep');
    expect(runMode(undefined, 'DAG')).to.equal('DAG');
    expect(runMode()).to.equal('StepByStep');
  });
});

describe('stepEdges', () => {
  it('chains steps in StepByStep mode', () => {
    expect(pairs(stepEdges(names('a', 'b', 'c'), [], 'StepByStep'))).to.deep.equal(['a>b', 'b>c']);
  });

  it('joins only declared dependencies in DAG mode', () => {
    const spec = [{ name: 'a' }, { name: 'b' }, { name: 'c', dependsOn: ['a', 'b'] }, { name: 'd' }];
    expect(pairs(stepEdges(names('a', 'b', 'c', 'd'), spec, 'DAG'))).to.deep.equal(['a>c', 'b>c']);
  });

  it('reads an input from another step output as a dependency', () => {
    const spec = [
      { name: 'build', outputs: [{ name: 'image', valueFrom: 'output.image' }] },
      { name: 'deploy', inputs: [{ from: 'image', parameterKey: 'image' }] },
    ];
    expect(pairs(stepEdges(names('build', 'deploy'), spec, 'DAG'))).to.deep.equal(['build>deploy']);
  });

  it('drops an edge a longer path already implies', () => {
    const spec = [{ name: 'a' }, { name: 'b' }, { name: 'c', dependsOn: ['a'] }];
    expect(pairs(stepEdges(names('a', 'b', 'c'), spec, 'StepByStep'))).to.deep.equal(['a>b', 'b>c']);
  });

  it('keeps the edges into a step that waits on later steps in order', () => {
    const spec = [
      { name: 'announce', dependsOn: ['smoke', 'notify'] },
      { name: 'deploy' },
      { name: 'verify', dependsOn: ['deploy'] },
      { name: 'notify', dependsOn: ['deploy'] },
      { name: 'approve', dependsOn: ['verify'] },
      { name: 'smoke', dependsOn: ['approve'] },
    ];
    const edges = pairs(
      stepEdges(names('announce', 'deploy', 'verify', 'notify', 'approve', 'smoke'), spec, 'StepByStep')
    );
    expect(edges).to.include('smoke>announce');
    expect(edges).to.include('notify>announce');
  });

  it('ignores dependencies on steps the run does not have', () => {
    const spec = [{ name: 'b', dependsOn: ['gone'] }];
    expect(stepEdges(names('b'), spec, 'DAG')).to.deep.equal([]);
  });
});

describe('groupMode', () => {
  it('prefers the group own mode, then the run sub-mode, then the workflow sub-mode', () => {
    expect(groupMode('StepByStep', 'DAG-DAG', 'DAG')).to.equal('StepByStep');
    expect(groupMode(undefined, 'StepByStep-StepByStep', 'DAG')).to.equal('StepByStep');
    expect(groupMode(undefined, undefined, 'StepByStep')).to.equal('StepByStep');
    expect(groupMode()).to.equal('DAG');
  });
});

describe('groupOpensItself', () => {
  it('opens a group whose sub-steps need attention', () => {
    expect(groupOpensItself({ subSteps: [{ phase: 'succeeded' }, { phase: 'suspending' }] })).to.equal(true);
    expect(groupOpensItself({ subSteps: [{ phase: 'failed' }] })).to.equal(true);
    expect(groupOpensItself({ subSteps: [{ phase: 'running' }] })).to.equal(true);
  });
  it('leaves a settled or unstarted group closed', () => {
    expect(groupOpensItself({ subSteps: [{ phase: 'succeeded' }, {}] })).to.equal(false);
    expect(groupOpensItself({})).to.equal(false);
  });
});
