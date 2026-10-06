import { expect } from 'chai';

import { allProjects, inProject, resolveProject, projectChanged, scopedTo } from '../currentProject';

describe('resolveProject', () => {
  it('keeps a project the user may open', () => {
    expect(resolveProject('shop', ['default', 'shop'], false)).to.equal('shop');
  });
  it('falls back to all projects for those who may see them', () => {
    expect(resolveProject('gone', ['default', 'shop'], true)).to.equal(allProjects);
    expect(resolveProject(undefined, ['default'], true)).to.equal(allProjects);
  });
  it('falls back to the first project for everyone else', () => {
    expect(resolveProject('gone', ['default', 'shop'], false)).to.equal('default');
    expect(resolveProject(allProjects, ['shop'], false)).to.equal('shop');
  });
});

describe('inProject', () => {
  it('keeps what belongs to the project, or everything for all projects', () => {
    expect(inProject('shop', 'shop')).to.equal(true);
    expect(inProject('shop', 'default')).to.equal(false);
    expect(inProject(allProjects, 'default')).to.equal(true);
  });
});

describe('projectChanged', () => {
  it('loads again when the project becomes known or another is picked', () => {
    expect(projectChanged({ current: '', resolved: false }, { current: '', resolved: true })).to.equal(true);
    expect(projectChanged({ current: 'shop', resolved: true }, { current: 'default', resolved: true })).to.equal(true);
    expect(projectChanged({ current: 'shop', resolved: true }, { current: 'shop', resolved: true })).to.equal(false);
    expect(projectChanged({ current: '', resolved: false }, { current: '', resolved: false })).to.equal(false);
  });
});

describe('scopedTo', () => {
  const items = [{ project: 'shop' }, { project: 'default' }];
  it('shows nothing until the project is known', () => {
    expect(scopedTo(items, { current: 'shop', resolved: false }, (i) => i.project)).to.deep.equal([]);
  });
  it("shows only the picked project's, or everything for all of them", () => {
    expect(scopedTo(items, { current: 'shop', resolved: true }, (i) => i.project)).to.deep.equal([{ project: 'shop' }]);
    expect(scopedTo(items, { current: '', resolved: true }, (i) => i.project)).to.deep.equal(items);
  });
});
