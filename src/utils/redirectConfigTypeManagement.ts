import { Dialog } from '@b-design/ui';
import i18n from '../i18n';

class RedirectConfigType {
  private static singleton: RedirectConfigType;
  public setDexConfig: React.ReactNode | null;
  constructor() {
    this.setDexConfig = this.setDexConfigDom();
  }
  private setDexConfigDom(): React.ReactNode {
    return Dialog.alert({
      title: i18n.t('No dex connector'),
      content: i18n.t('No dex connector, need to create dex  connector config '),
      closeable: true,
      closeMode: [],
      footerActions: ['ok'],
      onOk: () => {
        window.location.href = '/integrations/config-dex-connector/config';
      },
    });
  }
  public static getInstance() {
    if (!RedirectConfigType.singleton) {
      RedirectConfigType.singleton = new RedirectConfigType();
    }
    return RedirectConfigType.singleton;
  }
}

export default RedirectConfigType;