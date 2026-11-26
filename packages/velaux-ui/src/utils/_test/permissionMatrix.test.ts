import { expect } from 'chai';

import { buildPermissionMatrix, summariseRole } from '../permissionMatrix';

const platform = [
  { name: 'addon-management', alias: 'Addon Management' },
  { name: 'addon-view', alias: 'Addon View' },
  { name: 'admin', alias: 'Admin' },
  { name: 'project-list', alias: 'Project List' },
  { name: 'role-management', alias: 'Platform Role Management' },
  { name: 'role-view', alias: 'Role View' },
  { name: 'global-workflow-management', alias: 'Global Workflow Management' },
];

describe('buildPermissionMatrix', () => {
  it('pairs each view with its management, in the order first seen', () => {
    const m = buildPermissionMatrix(platform);
    expect(m.rows.map((r) => [r.key, r.label, r.view?.name, r.manage?.name])).to.deep.equal([
      ['addon', 'Addon', 'addon-view', 'addon-management'],
      ['project', 'Project', 'project-list', undefined],
      ['role', 'Role', 'role-view', 'role-management'],
      ['global-workflow', 'Global Workflow', undefined, 'global-workflow-management'],
    ]);
  });

  it('keeps the rest as others', () => {
    expect(buildPermissionMatrix(platform).others.map((p) => p.name)).to.deep.equal(['admin']);
  });

  it('falls back to the key without an alias', () => {
    expect(buildPermissionMatrix([{ name: 'env-view' }]).rows[0].label).to.equal('env');
  });
});

describe('summariseRole', () => {
  const m = buildPermissionMatrix(platform);

  it('gives one entry per resource, managed when the role manages it', () => {
    expect(summariseRole(['addon-view', 'addon-management', 'role-view'], m)).to.deep.equal([
      { label: 'Addon', manage: true },
      { label: 'Role', manage: false },
    ]);
  });

  it('puts others and unknown names last', () => {
    expect(summariseRole(['gone', 'admin', 'role-view'], m)).to.deep.equal([
      { label: 'Role', manage: false },
      { label: 'Admin', manage: false },
      { label: 'gone', manage: false },
    ]);
  });
});
