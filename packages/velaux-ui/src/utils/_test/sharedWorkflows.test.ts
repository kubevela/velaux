import { expect } from 'chai';

import type { SharedWorkflow } from '@velaux/data';
import { filterShared, usableShared } from '../sharedWorkflows';

const shared = (scope: SharedWorkflow['scope'], hidden?: boolean): SharedWorkflow => ({
  name: 'release',
  namespace: scope === 'global' ? 'vela-system' : 'shop',
  scope,
  hidden,
  steps: [],
});

describe('shared workflows an environment can run', () => {
  it('runs the project and global ones in the project namespace', () => {
    expect(usableShared(shared('project'))).to.equal(true);
    expect(usableShared(shared('global'))).to.equal(true);
  });

  it('does not run a global one hidden by the project one of its name', () => {
    expect(usableShared(shared('global', true))).to.equal(false);
  });

  it('runs only global ones outside the project namespace', () => {
    expect(usableShared(shared('project'), true)).to.equal(false);
    expect(usableShared(shared('global'), true)).to.equal(true);
  });
});

describe('filtering shared workflows', () => {
  const list: SharedWorkflow[] = [
    {
      ...shared('project'),
      name: 'release',
      alias: 'Standard release',
      usedBy: [{ appName: 'a', workflowName: 'w', envName: 'e' }],
    },
    { ...shared('global'), name: 'hotfix', description: 'Skips the soak' },
    { ...shared('global'), name: 'canary', usedElsewhere: 2 },
  ];
  const names = (out: SharedWorkflow[]) => out.map((s) => s.name);

  it('matches the name, alias or description', () => {
    expect(names(filterShared(list, 'STANDARD', 'all', 'all'))).to.deep.equal(['release']);
    expect(names(filterShared(list, 'soak', 'all', 'all'))).to.deep.equal(['hotfix']);
    expect(names(filterShared(list, '', 'all', 'all'))).to.have.length(3);
  });

  it('filters by where it is', () => {
    expect(names(filterShared(list, '', 'project', 'all'))).to.deep.equal(['release']);
    expect(names(filterShared(list, '', 'global', 'all'))).to.deep.equal(['hotfix', 'canary']);
  });

  it('counts another project as in use', () => {
    expect(names(filterShared(list, '', 'all', 'used'))).to.deep.equal(['release', 'canary']);
    expect(names(filterShared(list, '', 'all', 'unused'))).to.deep.equal(['hotfix']);
  });
});
