import { Dialog } from '@b-design/ui';
import i18n from '../i18n';

class ResetLogin {
  private static singleton: ResetLogin;
  public reset: React.ReactNode | null;
  constructor() {
    this.reset = this.resetDom();
  }
  private resetDom(): React.ReactNode {
    if (window.location.href.indexOf('/login') === -1) {
      return Dialog.alert({
        title: i18n.t('The token is expired(12010)'),
        content: i18n.t('Authentication failed, please log in again'),
        closeable: true,
        closeMode: [],
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
  public static getInstance() {
    if (!ResetLogin.singleton) {
      ResetLogin.singleton = new ResetLogin();
    }
    return ResetLogin.singleton;
  }
}

export default ResetLogin;
