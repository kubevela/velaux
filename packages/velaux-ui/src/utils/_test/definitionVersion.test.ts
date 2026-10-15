import { expect } from 'chai';

import type { DefinitionRevision } from '../definitionVersion';
import { inUseLabel, isNamed, joinType, latestLabel, splitType, versionLabel } from '../definitionVersion';

describe('definition versions', () => {
  it('splits a pinned type and joins it back', () => {
    expect(splitType('webapp@v2')).to.deep.equal({ name: 'webapp', version: 'v2' });
    expect(splitType('webapp@v1.2.0')).to.deep.equal({ name: 'webapp', version: 'v1.2.0' });
    expect(splitType('webapp')).to.deep.equal({ name: 'webapp' });
    expect(splitType(undefined)).to.deep.equal({ name: '' });
    expect(joinType('webapp', 'v2')).to.equal('webapp@v2');
    expect(joinType('webapp', undefined)).to.equal('webapp');
  });
  it('names a revision by its version, with the number where the version is named', () => {
    expect(versionLabel({ revision: 2, version: 'v2', hash: '', createTime: '' })).to.equal('v2');
    expect(versionLabel({ revision: 3, version: 'v1.2.0', hash: '', createTime: '' })).to.equal('1.2.0 (v3)');
  });
});

describe('latest', () => {
  it('names the newest revision it follows', () => {
    expect(latestLabel({ revision: 5, version: 'v1.1.0', hash: '', createTime: '' })).to.equal('latest (1.1.0 / v5)');
    expect(latestLabel({ revision: 3, version: 'v3', hash: '', createTime: '' })).to.equal('latest (v3)');
    expect(latestLabel(undefined)).to.equal('latest');
  });
  it('tells a named version from a bare revision', () => {
    expect(isNamed({ revision: 5, version: 'v1.1.0', hash: '', createTime: '' })).to.equal(true);
    expect(isNamed({ revision: 3, version: 'v3', hash: '', createTime: '' })).to.equal(false);
  });
});

describe('inUseLabel', () => {
  const revisions: DefinitionRevision[] = [
    { revision: 5, version: 'v1.1.0', hash: 'e', createTime: '' },
    { revision: 4, version: 'v1.0.0', hash: 'd', createTime: '' },
    { revision: 3, version: 'v3', hash: 'c', createTime: '' },
  ];
  it('follows the latest when no version is pinned', () => {
    expect(inUseLabel(undefined, revisions)).to.equal('latest (1.1.0 / v5)');
    expect(inUseLabel(undefined, [])).to.equal('latest');
  });
  it('names a pinned version with its revision, however it is written', () => {
    expect(inUseLabel('v1.0.0', revisions)).to.equal('1.0.0 / v4');
    expect(inUseLabel('1.0.0', revisions)).to.equal('1.0.0 / v4');
    expect(inUseLabel('v4', revisions)).to.equal('1.0.0 / v4');
  });
  it('names a pinned revision with no version name by its number', () => {
    expect(inUseLabel('v3', revisions)).to.equal('v3');
  });
  it('shows a pinned version it cannot find as written', () => {
    expect(inUseLabel('v9', revisions)).to.equal('v9');
  });
});
