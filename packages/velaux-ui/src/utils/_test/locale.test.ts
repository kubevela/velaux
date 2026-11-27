import { expect } from 'chai';

import { getConfigProviderLocale } from '../locale';

describe('getConfigProviderLocale', () => {
  it('returns English @alifd/next locale for en and non-zh languages', () => {
    const enLocale = getConfigProviderLocale('en') as { Card: { expand: string; fold: string } };
    expect(enLocale.Card.expand).to.equal('Expand');
    expect(enLocale.Card.fold).to.equal('Fold');

    const enUSLocale = getConfigProviderLocale('en-US') as { Card: { expand: string; fold: string } };
    expect(enUSLocale.Card.expand).to.equal('Expand');

    const fallbackLocale = getConfigProviderLocale('fr') as { Card: { expand: string; fold: string } };
    expect(fallbackLocale.Card.expand).to.equal('Expand');
  });

  it('returns Chinese @alifd/next locale for zh languages', () => {
    const zhLocale = getConfigProviderLocale('zh') as { Card: { expand: string; fold: string } };
    expect(zhLocale.Card.expand).to.equal('展开');
    expect(zhLocale.Card.fold).to.equal('收起');

    const zhCNLocale = getConfigProviderLocale('zh-CN') as { Card: { expand: string; fold: string } };
    expect(zhCNLocale.Card.expand).to.equal('展开');
  });
});
