import { Dialog } from '@b-design/ui';
import i18n from '../i18n';

class RedirectUser {
  private static singleton: RedirectUser;
  public setEmail: React.ReactNode | null;
  constructor() {
    this.setEmail = this.setEmailDom();
  }
  private setEmailDom(): React.ReactNode {
    return Dialog.alert({
      title: i18n.t('Email address empty'),
      content: i18n.t('Your email address is empty, need to update it'),
      closeable: true,
      closeMode: [],
      footerActions: ['ok'],
      onOk: () => {
        window.location.href = '/users';
      },
    });
  }
  public static getInstance() {
    if (!RedirectUser.singleton) {
      RedirectUser.singleton = new RedirectUser();
    }
    return RedirectUser.singleton;
  }
}

export default RedirectUser;
