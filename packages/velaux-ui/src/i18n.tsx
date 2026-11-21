import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import En from './locals/En/en.json';
import Zh from './locals/Zh/zh.json';
import { getLanguage } from './utils/common';
import { customisationService, terminologyPostProcessor } from './services/CustomisationService';

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
  .use(terminologyPostProcessor)
  .init({
    resources,
    // Every string passes through the customised terminology, missing keys too.
    postProcess: ['terminology'],
    lng: currentLanguage,
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });
// A new customisation re-renders what was translated with the last one.
customisationService.subscribe(() => {
  i18n.changeLanguage(i18n.language);
});

export default i18n;
