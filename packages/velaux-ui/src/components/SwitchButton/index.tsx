import React, { useState } from 'react';
import './index.less';
import { Dropdown, Menu } from '@alifd/next';
import { useTranslation } from 'react-i18next';
import { TbLanguage } from 'react-icons/tb';

import { getLanguage } from '../../utils/common';

const supportedLanguages = ['en', 'zh', 'ja'] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

const normalizeLanguage = (lang?: string): SupportedLanguage => {
  const base = (lang || '').toLowerCase().split('-')[0];
  return (supportedLanguages as readonly string[]).includes(base) ? (base as SupportedLanguage) : 'en';
};

const SwitchLanguage = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<SupportedLanguage>(() => normalizeLanguage(i18n.language || getLanguage()));
  const changeLanguage = (next: SupportedLanguage) => {
    localStorage.setItem('lang', next);
    i18n.changeLanguage(next);
    setLang(next);
  };
  return (
    <Dropdown trigger={<TbLanguage size="18" />}>
      <Menu>
        <Menu.Item onClick={() => changeLanguage('en')}>English {lang === 'en' ? '(Now)' : ''}</Menu.Item>
        <Menu.Item onClick={() => changeLanguage('zh')}>中文{lang === 'zh' ? '(当前)' : ''}</Menu.Item>
        <Menu.Item onClick={() => changeLanguage('ja')}>日本語{lang === 'ja' ? '(現在)' : ''}</Menu.Item>
      </Menu>
    </Dropdown>
  );
};
export default SwitchLanguage;
