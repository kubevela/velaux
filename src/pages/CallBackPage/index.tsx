import React from 'react';
import { loginSSO } from '../../api/authentication';
import querystring from 'query-string';

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
    loginSSO({ code }).then((res: any) => {
      if (res && res.accessToken) {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        this.props.history.push('/');
      } 
    }).catch(()=>{
      setTimeout(() => {
        this.props.history.push('/login');
      }, 3000);
    });
  };

  render() {
    return null;
  }
}
