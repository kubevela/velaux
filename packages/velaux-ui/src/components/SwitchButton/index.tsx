import React, { useState } from 'react';
import './index.less';
import { Dropdown, Menu } from '@alifd/next';
import { useTranslation } from 'react-i18next';
import { TbLanguage } from 'react-icons/tb';

import { getLanguage } from '../../utils/common';

const SwitchLanguage = () => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(getLanguage());
  return (
    <Dropdown trigger={<TbLanguage size="18" />}>
      <Menu>
        <Menu.Item
          onClick={() => {
            i18n.changeLanguage('en');
            localStorage.setItem('lang', 'en');
            setLanguage('en');
          }}
        >
          English {language === 'en' ? '(Now)' : ''}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            i18n.changeLanguage('zh');
            localStorage.setItem('lang', 'zh');
            setLanguage('zh');
          }}
        >
          中文{language === 'zh' ? '(当前)' : ''}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            i18n.changeLanguage('ja');
            localStorage.setItem('lang', 'ja');
            setLanguage('ja');
          }}
        >
          日本語{language === 'ja' ? '(選択中)' : ''}
        </Menu.Item>
      </Menu>
    </Dropdown>
  );
};
export default SwitchLanguage;
