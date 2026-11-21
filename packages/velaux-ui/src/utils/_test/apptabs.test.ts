import { expect } from 'chai';

import {
  addLink,
  environmentViews,
  statusMode,
  tabRuns,
  tabsReadOnly,
  wantsAdd,
} from '../../layout/Application/components/AppTabs/add';

describe('configure tabs', () => {
  it('asks a tab for its add dialog through the URL', () => {
    expect(addLink('/applications/shop/config/components')).to.equal('/applications/shop/config/components?add=1');
    expect(wantsAdd('?add=1')).to.equal(true);
    expect(wantsAdd('?x=y&add=1')).to.equal(true);
    expect(wantsAdd('')).to.equal(false);
    expect(wantsAdd(undefined)).to.equal(false);
    expect(wantsAdd('?add=0')).to.equal(false);
  });

  it('offers no + on a read-only application, or before its details load', () => {
    expect(tabsReadOnly({ name: 'shop', readOnly: false }, 'shop')).to.equal(false);
    expect(tabsReadOnly({ name: 'addon-fluxcd', readOnly: true }, 'addon-fluxcd')).to.equal(true);
    expect(tabsReadOnly(undefined, 'shop')).to.equal(true);
    expect(tabsReadOnly({ name: 'other', readOnly: false }, 'shop')).to.equal(true, "another application's details");
  });
});

describe('tabRuns', () => {
  it('groups neighbouring tabs under their shared label, in order', () => {
    const tabs = [
      { key: 'overview' },
      { key: 'sources', group: 'Configure' },
      { key: 'components', group: 'Configure' },
      { key: 'workflows', group: 'Deploy' },
      { key: 'revisions', group: 'Deploy' },
    ];
    const runs = tabRuns(tabs).map((r) => ({ group: r.group, keys: r.tabs.map((t) => t.key) }));
    expect(runs).to.deep.equal([
      { group: undefined, keys: ['overview'] },
      { group: 'Configure', keys: ['sources', 'components'] },
      { group: 'Deploy', keys: ['workflows', 'revisions'] },
    ]);
  });
});

describe('environmentViews', () => {
  const base = '/applications/shop/envbinding/prod';
  const active = (path: string) =>
    environmentViews(base)
      .filter((v) => v.active(path))
      .map((v) => v.key);
  it('marks exactly the view a path is on', () => {
    expect(active(`${base}/status`)).to.deep.equal(['resources']);
    expect(active(`${base}/status/overview`)).to.deep.equal(['overview']);
    expect(active(`${base}/status/graph`)).to.deep.equal(['graph']);
    expect(active(`${base}/workflow/records/run-1`)).to.deep.equal(['workflow']);
    expect(active(`${base}/yaml`)).to.deep.equal(['yaml']);
  });
  it('reads the status view back from its URL', () => {
    expect(statusMode(undefined)).to.equal('resource-graph');
    expect(statusMode('overview')).to.equal('overview');
    expect(statusMode('graph')).to.equal('application-graph');
    expect(statusMode('nonsense')).to.equal('resource-graph');
  });
});
