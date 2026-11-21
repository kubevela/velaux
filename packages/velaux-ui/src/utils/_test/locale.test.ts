import { expect } from 'chai';
import i18next from 'i18next';

import Ja from '../../locals/Ja/ja.json';
import Zh from '../../locals/Zh/zh.json';
import { getLanguage } from '../common';
import { locale } from '../locale';

const collectKeys = (obj: Record<string, any>, prefix = ''): string[] =>
  Object.keys(obj)
    .sort()
    .flatMap((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      return value && typeof value === 'object' ? collectKeys(value, path) : [path];
    });

describe('Japanese localization', () => {
  const origWindow = (global as any).window;
  const origLocalStorage = (global as any).localStorage;
  let storedLang: string | null = null;

  const setEnv = (navigatorLanguage: string, savedLang: string | null = null) => {
    storedLang = savedLang;
    (global as any).window = { navigator: { language: navigatorLanguage } };
    (global as any).localStorage = {
      getItem: (key: string) => (key === 'lang' ? storedLang : null),
      setItem: (key: string, value: string) => {
        if (key === 'lang') {
          storedLang = value;
        }
      },
    };
  };

  afterEach(() => {
    (global as any).window = origWindow;
    (global as any).localStorage = origLocalStorage;
  });

  describe('getLanguage', () => {
    it('normalizes regional and uppercase language tags', () => {
      setEnv('ja-JP');
      expect(getLanguage()).to.equal('ja');

      setEnv('JA-jp');
      expect(getLanguage()).to.equal('ja');

      setEnv('en-US', 'ja');
      expect(getLanguage()).to.equal('ja');

      setEnv('en-US', 'ja-JP');
      expect(getLanguage()).to.equal('ja');
    });
  });

  describe('component locale', () => {
    it('returns Japanese component labels matching every English key', () => {
      setEnv('en-US');
      const enLocale = locale();

      setEnv('ja-JP');
      const jaLocale = locale();

      expect(collectKeys(jaLocale)).to.deep.equal(collectKeys(enLocale));
      expect(jaLocale.Dialog.cancel).to.equal('キャンセル');
      expect(jaLocale.Table.empty).to.equal('データがありません');
    });

    it('falls back to English for unsupported languages', () => {
      setEnv('en-US');
      const enLocale = locale();

      setEnv('fr-FR');
      expect(locale()).to.deep.equal(enLocale);
    });
  });

  describe('ja.json catalog', () => {
    const jaEntries = Ja as Record<string, string>;
    const zhEntries = Zh as Record<string, string>;

    it('covers every key in zh.json with non-empty translations', () => {
      const missing = Object.keys(zhEntries).filter((key) => !(key in jaEntries));
      expect(missing).to.deep.equal([]);

      const empty = Object.entries(jaEntries)
        .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
        .map(([key]) => key);
      expect(empty).to.deep.equal([]);
    });

    it('preserves interpolation placeholders and $( ) expressions', () => {
      for (const [key, value] of Object.entries(jaEntries)) {
        const keyPlaceholders = (key.match(/\{\{[^}]+\}\}/g) || []).sort();
        const valuePlaceholders = (value.match(/\{\{[^}]+\}\}/g) || []).sort();
        expect(valuePlaceholders, `placeholder mismatch for "${key}"`).to.deep.equal(keyPlaceholders);

        const keyExpressions = (key.match(/\$\([^)]*\)/g) || []).sort();
        const valueExpressions = (value.match(/\$\([^)]*\)/g) || []).sort();
        expect(valueExpressions, `expression mismatch for "${key}"`).to.deep.equal(keyExpressions);
      }
    });

    it('translates standard keys and keys containing colons when nsSeparator is disabled', async () => {
      const instance = i18next.createInstance();
      await instance.init({
        resources: { ja: { translation: jaEntries } },
        lng: 'ja',
        fallbackLng: 'en',
        keySeparator: false,
        nsSeparator: false,
        interpolation: { escapeValue: false },
      });

      expect(instance.t('Applications')).to.equal('アプリケーション');
      expect(instance.t('Language')).to.equal('言語');
      expect(instance.t('Pending: waits for the workload to be healthy')).to.equal(
        '待機中: ワークロードが正常になるのを待っています'
      );
      expect(instance.t('On: VelaUX deploys are refused while it is on')).to.equal(
        'オン: 有効時は VelaUX からのデプロイが拒否されます'
      );
    });
  });
});
