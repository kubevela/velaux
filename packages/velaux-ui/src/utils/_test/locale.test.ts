import { expect } from 'chai';

import Ja from '../../locals/Ja/ja.json';
import Zh from '../../locals/Zh/zh.json';
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
  });
});
