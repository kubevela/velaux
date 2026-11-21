import { expect } from 'chai';

import { addDependency, canDependOn, removeDependency } from '../../components/WorkflowStudio/edit';

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
  { name: 'notify', type: 'suspend', dependsOn: ['deploy'] },
  { name: 'reads', type: 'suspend', inputs: [{ from: 'image', parameterKey: 'x' }] },
  { name: 'build', type: 'suspend', outputs: [{ name: 'image', valueFrom: 'v' }] },
];

describe('canDependOn', () => {
  it('lets a step wait on another it does not already wait on', () => {
    expect(canDependOn(steps, 'migrate', 'notify')).to.equal(true);
  });
  it('refuses the step itself and one it already waits on', () => {
    expect(canDependOn(steps, 'notify', 'notify')).to.equal(false);
    expect(canDependOn(steps, 'deploy', 'notify')).to.equal(false);
  });
  it('refuses a wait that would make a loop, through dependsOn or inputs', () => {
    expect(canDependOn(steps, 'canary', 'deploy')).to.equal(false);
    expect(canDependOn(steps, 'reads', 'build')).to.equal(false);
  });
  it('refuses a step not in the list', () => {
    expect(canDependOn(steps, 'elsewhere', 'notify')).to.equal(false);
  });
});

describe('addDependency', () => {
  it('adds the earlier step to the waiting step dependsOn', () => {
    const out = addDependency(steps, 'migrate', 'notify');
    expect(out.find((s) => s.name === 'notify')?.dependsOn).to.deep.equal(['deploy', 'migrate']);
    expect(out.find((s) => s.name === 'canary')).to.deep.equal(steps[2]);
  });
  it('starts a dependsOn where there was none', () => {
    expect(addDependency(steps, 'deploy', 'build').find((s) => s.name === 'build')?.dependsOn).to.deep.equal([
      'deploy',
    ]);
  });
});

describe('removeDependency', () => {
  it('removes a dependsOn entry', () => {
    const out = removeDependency(steps, 'deploy', 'notify');
    expect(out?.find((s) => s.name === 'notify')?.dependsOn).to.deep.equal([]);
  });
  it('cannot remove a wait that comes from inputs', () => {
    expect(removeDependency(steps, 'build', 'reads')).to.equal(undefined);
  });
});
