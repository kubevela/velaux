import fs from 'fs';
import path from 'path';
import { expect } from 'chai';

import Ja from '../../locals/Ja/ja.json';
import Zh from '../../locals/Zh/zh.json';
import { locale } from '../locale';

const collectEntries = (obj: Record<string, any>, prefix = ''): Array<[string, string]> =>
  Object.keys(obj)
    .sort()
    .flatMap((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      return value && typeof value === 'object' ? collectEntries(value, fullKey) : [[fullKey, String(value)]];
    });

const extractTopLevelJsonKeys = (raw: string): string[] => {
  const keys: string[] = [];
  const linePattern = /^\s*"((?:\\.|[^"\\])*)"\s*:/gm;
  let match: RegExpExecArray | null;
  while ((match = linePattern.exec(raw)) !== null) {
    keys.push(JSON.parse(`"${match[1]}"`));
  }
  return keys;
};

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
    it('returns Japanese component labels matching every English key and placeholder', () => {
      setEnv('en-US');
      const enLocale = locale();
      const enEntries = new Map(collectEntries(enLocale));

      setEnv('ja-JP');
      const jaLocale = locale();
      const jaEntries = collectEntries(jaLocale);

      expect(jaEntries.map(([k]) => k)).to.deep.equal(Array.from(enEntries.keys()));
      for (const [key, value] of jaEntries) {
        expect(value.trim(), `empty locale entry for "${key}"`).to.not.equal('');
        const enPlaceholders = ((enEntries.get(key) || '').match(/\{[^}]+\}/g) || []).sort();
        const jaPlaceholders = (value.match(/\{[^}]+\}/g) || []).sort();
        expect(jaPlaceholders, `placeholder mismatch for "${key}"`).to.deep.equal(enPlaceholders);
      }
      expect(jaLocale.Dialog.cancel).to.equal('キャンセル');
      expect(jaLocale.Table.empty).to.equal('データがありません');
    });

    it('prefers localStorage lang over navigator.language for en, zh, and ja', () => {
      setEnv('en-US', 'ja');
      expect(locale().Dialog.cancel).to.equal('キャンセル');

      setEnv('ja-JP', 'zh');
      expect(locale().Dialog.cancel).to.equal('取消');

      setEnv('ja-JP', 'en');
      expect(locale().Dialog.cancel).to.equal('Cancel');
    });

    it('falls back to English for unsupported languages', () => {
      setEnv('en-US');
      const enLocale = locale();

      setEnv('fr-FR');
      expect(locale()).to.deep.equal(enLocale);

      setEnv('ja-JP', 'de');
      expect(locale()).to.deep.equal(enLocale);
    });
  });

  describe('i18n setup', () => {
    it('registers ja alongside en and zh and switches languages', async () => {
      setEnv('en-US');
      const { default: i18n } = await import('../../i18n');
      const prevLang = i18n.language;

      try {
        expect(i18n.hasResourceBundle('en', 'translation')).to.equal(true);
        expect(i18n.hasResourceBundle('zh', 'translation')).to.equal(true);
        expect(i18n.hasResourceBundle('ja', 'translation')).to.equal(true);

        await i18n.changeLanguage('ja');
        expect(i18n.t('Applications')).to.equal('アプリケーション');
        expect(i18n.t('Language')).to.equal('言語');
        expect(i18n.t('Ready {{ready}}', { ready: '2/2' })).to.equal('準備完了 2/2');

        await i18n.changeLanguage('zh');
        expect(i18n.t('Applications')).to.equal('应用列表');

        await i18n.changeLanguage('en');
        expect(i18n.t('Applications')).to.equal('Applications');
      } finally {
        await i18n.changeLanguage(prevLang);
      }
    });
  });

  describe('ja.json catalog', () => {
    const jaEntries = Ja as Record<string, string>;
    const zhEntries = Zh as Record<string, string>;

    it('has no duplicate keys in the raw JSON file', () => {
      const raw = fs.readFileSync(path.resolve(__dirname, '../../locals/Ja/ja.json'), 'utf8');
      const keys = extractTopLevelJsonKeys(raw);
      const seen = new Set<string>();
      const duplicates: string[] = [];
      for (const key of keys) {
        if (seen.has(key)) {
          duplicates.push(key);
        }
        seen.add(key);
      }
      expect(duplicates).to.deep.equal([]);
      expect(keys.length).to.equal(Object.keys(jaEntries).length);
    });

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
