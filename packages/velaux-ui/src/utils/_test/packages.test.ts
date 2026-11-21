import { expect } from 'chai';

import { filterPackages, packageLink } from '../../pages/Packages/packages';

const pkgs = [
  { name: 'mysql', namespace: 'vela-system', path: 'ext/db/mysql', functions: 1, files: 1 },
  { name: 'kube', path: 'vela/kube', builtin: true, variant: 'workflow-steps', functions: 6, files: 1 },
  { name: 'http', path: 'vela/http', builtin: true, variant: 'components', functions: 1, files: 1 },
];

describe('packages', () => {
  it('links a resource by namespace and name, a built-in by path and variant', () => {
    expect(packageLink(pkgs[0])).to.equal('/packages/vela-system/mysql');
    expect(packageLink(pkgs[1])).to.equal('/packages/builtin?path=vela%2Fkube&variant=workflow-steps');
  });

  it('filters by source and by a name or path containing the query', () => {
    expect(filterPackages(pkgs, '', 'all').length).to.equal(3);
    expect(filterPackages(pkgs, '', 'cluster').map((p) => p.name)).to.deep.equal(['mysql']);
    expect(filterPackages(pkgs, '', 'builtin').map((p) => p.name)).to.deep.equal(['kube', 'http']);
    expect(filterPackages(pkgs, 'KUBE', 'all').map((p) => p.name)).to.deep.equal(['kube']);
    expect(filterPackages(pkgs, 'ext/db', 'all').map((p) => p.name)).to.deep.equal(['mysql']);
  });
});
