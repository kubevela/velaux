import React, { useState } from 'react';
import './index.less';
import { Dropdown, Menu } from '@alifd/next';
import { useTranslation } from 'react-i18next';
import { TbLanguage } from 'react-icons/tb';

import { getLanguage } from '../../utils/common';


const SwitchLanguage = () => {
  const { i18n } = useTranslation();
  const _isEnglish = getLanguage() === 'en';
  const [isEnglish, setIsEnglish] = useState(_isEnglish);
  return (
    <Dropdown trigger={<TbLanguage size="18" />}>
      <Menu>
        <Menu.Item
          onClick={() => {
            i18n.changeLanguage('en');
            localStorage.setItem('lang', 'en');
            setIsEnglish(true);
          }}
        >
          English {isEnglish ? '(Now)' : ''}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            i18n.changeLanguage('zh');
            localStorage.setItem('lang', 'zh');
            setIsEnglish(false);
          }}
        >
          中文{!isEnglish ? '(当前)' : ''}
        </Menu.Item>
      </Menu>
    </Dropdown>
  );
};
export default SwitchLanguage;
