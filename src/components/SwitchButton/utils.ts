type Navigator = {
  language: string;
  userLanguage?: string;
};

export function getLanguage() {
  let navigator: Navigator = window.navigator;
  const lang = navigator.language || navigator.userLanguage || 'zh';
  return localStorage.getItem('lang') || lang.split('-')[0];
}
