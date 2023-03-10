import { Dialog, Button } from '@alifd/next';
import querystring from 'query-string';
import React from 'react';

import { loginSSO } from '../../api/authentication';
import i18n from '../../i18n';

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
          this.props.history.push('/applications');
        }
      })
      .catch((err) => {
        let customErrorMessage = '';
        if (err.BusinessCode) {
          customErrorMessage = `${err.Message}(${err.BusinessCode})`;
        } else {
          customErrorMessage = 'Please check the network or contact the administrator!';
        }
        return Dialog.alert({
          title: i18n.t('Dex Error').toString(),
          content: `${i18n.t(customErrorMessage)}`,
          closeable: true,
          closeMode: [],
          footer: <Button onClick={this.handleClickRetry}>{i18n.t('Retry').toString()}</Button>,
        });
      });
  };

  handleClickRetry = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  render() {
    return null;
  }
}
