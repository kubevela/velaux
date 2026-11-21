import React, { useState } from 'react';
import './index.less';
import { Dropdown, Menu } from '@alifd/next';
import { useTranslation } from 'react-i18next';
import { TbLanguage } from 'react-icons/tb';

import { getLanguage } from '../../utils/common';

const SwitchLanguage = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(getLanguage());
  const selectLang = (next: string) => {
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
    setLang(next);
  };
  return (
    <Dropdown trigger={<TbLanguage size="18" />}>
      <Menu>
        <Menu.Item onClick={() => selectLang('ja')}>
          日本語 {lang === 'ja' ? '(現在)' : ''}
        </Menu.Item>
        <Menu.Item onClick={() => selectLang('en')}>
          English {lang === 'en' ? '(Now)' : ''}
        </Menu.Item>
        <Menu.Item onClick={() => selectLang('zh')}>
          中文 {lang === 'zh' ? '(当前)' : ''}
        </Menu.Item>
      </Menu>
    </Dropdown>
  );
};
export default SwitchLanguage;
