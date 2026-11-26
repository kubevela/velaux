import { Dialog } from '@alifd/next';

import i18n from '../i18n';

import { signedOutTitle } from './authError';

import { locale } from './locale';

class ResetLogin {
  private static singleton: ResetLogin;
  public reset: React.ReactNode | null;
  constructor(code?: number) {
    this.reset = this.resetDom(code);
  }
  private resetDom(code?: number): React.ReactNode | null {
    if (window.location.href.indexOf('/login') === -1) {
      return Dialog.alert({
        title: i18n.t(signedOutTitle(code)).toString(),
        content: i18n.t('Authentication failed, please log in again').toString(),
        closeable: true,
        closeMode: [],
        locale: locale().Dialog,
        footerActions: ['ok'],
        onOk: () => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        },
      });
    } else {
      return null;
    }
  }
  static getInstance(code?: number) {
    if (!ResetLogin.singleton) {
      ResetLogin.singleton = new ResetLogin(code);
    }
    return ResetLogin.singleton;
  }
}

export default ResetLogin;
