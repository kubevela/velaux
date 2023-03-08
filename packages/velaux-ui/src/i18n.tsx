import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import En from './locals/En/en.json';
import Zh from './locals/Zh/zh.json';
import { getLanguage } from './utils/common';

const resources = {
  en: {
    translation: En,
  },
  zh: {
    translation: Zh,
  },
};

const currentLanguage = getLanguage();
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: currentLanguage,
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });
export default i18n;
