import { expect } from 'chai';
import i18next from 'i18next';

import { i18nSeparators } from '../i18nOptions';

describe('i18n separators', () => {
  const t = async (translation: Record<string, string>) => {
    const i = i18next.createInstance();
    await i.init({ lng: 'en', resources: { en: { translation } }, ...i18nSeparators });
    return i.t.bind(i);
  };

  it('keeps a missing key with a colon whole', async () => {
    const tr = await t({});
    expect(tr('Managed by its addon: change it from the Addons page.')).to.equal(
      'Managed by its addon: change it from the Addons page.'
    );
    expect(tr('Workflow steps:')).to.equal('Workflow steps:');
  });

  it('finds a translated key with a colon', async () => {
    const tr = await t({ 'On: refresh live': '开: 实时刷新' });
    expect(tr('On: refresh live')).to.equal('开: 实时刷新');
  });
});
