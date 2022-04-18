import React from 'react';
import { loginSSO } from '../../api/authentication';
import querystring from 'query-string';
import { Dialog } from '@b-design/ui';
import i18n from '../../i18n';
import local from '../../utils/locale';

type Props = {
  location: {
    state: {
      pathname: string;
    };
  };
  history: {
    push: (path: string, state?: any) => void;
  };
};

export default class CallBackPage extends React.Component<Props> {
  componentDidMount() {
    this.getCode();
  }

  getCode = () => {
    if (window.location.href.indexOf('/callback?code=') != -1) {
      const { search } = window.location;
      const params = querystring.parse(search);
      const code: any = params.code;
      if (code) {
        this.onLogonSSO(code);
      }
    }
  };

  onLogonSSO = (code: any) => {
    loginSSO({ code })
      .then((res: any) => {
        if (res && res.accessToken) {
          localStorage.setItem('token', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          this.props.history.push('/');
        }
      })
      .catch((err) => {
        let customErrorMessage = '';
        const redirectLogin = i18n.t('go to login page');
        if (err.BusinessCode) {
          customErrorMessage = `${err.Message}(${err.BusinessCode})`;
        } else {
          customErrorMessage = 'Please check the network or contact the administrator!';
        }
        return Dialog.alert({
          title: i18n.t('Dex Error'),
          content: `${i18n.t(customErrorMessage)},${redirectLogin}`,
          closeable: true,
          closeMode: [],
          footerActions: ['ok'],
          locale: local.Dialog,
          onOk: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          },
        });
      });
  };

  render() {
    return null;
  }
}