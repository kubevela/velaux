import { expect } from 'chai';

import type { SearchItem } from '../../components/QuickSearch/search';
import { addRecent, isQuickSearchKey, matchItems, recentFromPath } from '../../components/QuickSearch/search';

const items: SearchItem[] = [
  { group: 'Applications', label: 'checkout', detail: 'default', to: '/applications/checkout/config' },
  { group: 'Applications', label: 'catalog-api', to: '/applications/catalog-api/config' },
  { group: 'Applications', label: 'shop-checkout', to: '/applications/shop-checkout/config' },
  { group: 'Configs', label: 'cluster-info', detail: 'Cluster info', to: '/configs/cluster-info/config' },
  { group: 'Pages', label: 'Configs', to: '/configs' },
];
const groups = ['Applications', 'Configs', 'Pages'];

describe('quick search', () => {
  it('puts a label starting with the query before one containing it', () => {
    expect(matchItems(items, 'check', groups).map((i) => i.label)).to.deep.equal(['checkout', 'shop-checkout']);
  });

  it('matches a word of the label or detail', () => {
    expect(matchItems(items, 'info', groups).map((i) => i.label)).to.deep.equal(['cluster-info']);
    expect(matchItems(items, 'default', groups).map((i) => i.label)).to.deep.equal(['checkout']);
  });

  it('keeps the group order and caps each group', () => {
    expect(matchItems(items, 'c', groups, 2).map((i) => i.group)).to.deep.equal([
      'Applications',
      'Applications',
      'Configs',
      'Pages',
    ]);
  });

  it('opens on Cmd+K or Ctrl+K only', () => {
    expect(isQuickSearchKey({ key: 'k', metaKey: true, ctrlKey: false })).to.equal(true);
    expect(isQuickSearchKey({ key: 'K', metaKey: false, ctrlKey: true })).to.equal(true);
    expect(isQuickSearchKey({ key: 'k', metaKey: false, ctrlKey: false })).to.equal(false);
  });
});

describe('recently opened', () => {
  const item = (label: string): SearchItem => ({ group: 'Applications', label, to: `/applications/${label}/config` });

  it('puts the latest first, once, and keeps a few', () => {
    let list: SearchItem[] = [];
    for (const name of ['a', 'b', 'c', 'b', 'd', 'e', 'f', 'g']) {
      list = addRecent(list, item(name));
    }
    expect(list.map((i) => i.label)).to.deep.equal(['g', 'f', 'e', 'd', 'b', 'c']);
  });

  it('reads an application page visit as that application', () => {
    expect(recentFromPath('/applications/orders/envbinding/system/status')).to.deep.equal({
      group: 'Applications',
      label: 'orders',
      to: '/applications/orders/config',
    });
    expect(recentFromPath('/applications')).to.equal(undefined);
    expect(recentFromPath('/definitions/component')).to.equal(undefined);
  });
});
