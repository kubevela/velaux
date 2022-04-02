import { Dialog } from '@b-design/ui';
import i18n from '../i18n';

class ResetLogin {
  private static singleton: ResetLogin;
  public reset() {
    if (window.location.href.indexOf('/login') === -1) {
      Dialog.alert({
        title: i18n.t('The token is expired(12010)'),
        content: i18n.t('Authentication failed, please log in again'),
        footerActions: ['ok'],
        onOk: () => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        },
      });
    }
  }
  public static getInstance() {
    if (!ResetLogin.singleton) {
      ResetLogin.singleton = new ResetLogin();
    }
    return ResetLogin.singleton;
  }
}

export default ResetLogin;
