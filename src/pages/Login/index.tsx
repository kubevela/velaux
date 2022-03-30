import React, { Component } from 'react';
import { Card, Button, Input, Form, Field, Icon } from '@b-design/ui';
import Translation from '../../components/Translation';
import { getDexConfig, loginLocal, getLoginType } from '../../api/authentication';
import Logo from '../../assets/kubevela-logo.png';
import { If } from 'tsx-control-statements/components';
import { checkName, checkUserPassword } from '../../utils/common';
import './index.less';
import i18n from '../../i18n';

type Props = {
  code: string;
  location: {
    state: {
      pathname: string;
    };
  };
  history: {
    push: (path: string, state?: any) => void;
  };
};
type State = {
  dexConfig: {
    clientID: string;
    clientSecret: string;
    issuer: string;
    redirectURL: string;
  };
  loginType: string;
  loginErrorMessage: string;
};
export default class LoginPage extends Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      dexConfig: {
        clientID: '',
        clientSecret: '',
        issuer: '',
        redirectURL: '',
      },
      loginType: '',
      loginErrorMessage: '',
    };
  }
  componentDidMount() {
    this.ontDexConfig();
    this.onGetLoginType();
  }
  onGetLoginType = () => {
    getLoginType()
      .then((res: any) => {
        if (res && res.loginType) {
          this.setState(
            {
              loginType: res.loginType,
            },
            () => {
              const { loginType } = this.state;
              if (loginType === 'dex') {
                this.onGetDexCode();
              }
            },
          );
        }
      })
      .catch();
  };
  ontDexConfig = () => {
    getDexConfig()
      .then((res) => {
        if (res) {
          this.setState({
            dexConfig: res,
          });
        }
      })
      .catch();
  };

  handleSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { username, password } = values;
      const params = {
        username: username,
        password,
      };
      loginLocal(params).then((res: any) => {
        debugger;
        if (res && res.accessToken) {
          localStorage.setItem('token', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          this.props.history.push('/');
        }
        console.log('res', res)
      }).catch((err) => {
        this.setState({
          loginErrorMessage: err.Message
        })
        console.log('loginLocalError', err);
      });
    });
  };
  onGetDexCode = () => {
    const { clientID, issuer, redirectURL } = this.state.dexConfig;
    const newRedirectURl = encodeURIComponent(redirectURL);
    const dexClientURL = `${issuer}/auth?client_id=${clientID}&redirect_uri=${newRedirectURl}&response_type=code&scope=openid+profile+email+offline_access&state=velaux`;
    window.location.href = dexClientURL;
  };
  render() {
    const FormItem = Form.Item;
    const init = this.field.init;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };
    const { loginType,loginErrorMessage } = this.state;
    return (
      <div className="full">
        <div className="login-wrapper">
          {/* <If condition={loginType === 'dex'}>
            <div />
          </If> */}
          <If condition={true || loginType === 'local'}>
            <div className="login-card-wrapper">
              <Card contentHeight={'auto'}>
                <div className="logo-img-wrapper">
                  <img src={Logo} />
                </div>
                <Form onSubmit={this.handleSubmit} {...formItemLayout} field={this.field}>
                  <FormItem
                    label={<Translation className="label-title">Username</Translation>}
                    labelAlign="top"
                    required
                  >
                    <Input
                      name="username"
                      placeholder={i18n.t('Please input the username').toString()}
                      {...init('username', {
                        rules: [
                          {
                            required: true,
                            pattern: checkName,
                            message: <Translation>Please input the username</Translation>,
                          },
                        ],
                      })}
                    />
                  </FormItem>
                  <FormItem
                    label={<Translation className="label-title">Password</Translation>}
                    labelAlign="top"
                    required
                  >
                    <Input
                      name="password"
                      htmlType="password"
                      placeholder={i18n.t('Please input the password').toString()}
                      {...init('password', {
                        rules: [
                          {
                            required: true,
                            pattern: checkUserPassword,
                            message: (
                              <Translation>
                                The password should be 8-16 bits and contain at least one number and
                                one letter
                              </Translation>
                            ),
                          },
                        ],
                      })}
                    />
                  </FormItem>
                </Form>
          
                <If condition={loginErrorMessage}>
                     <div className='logo-error-wrapper'>
                         <Icon type='warning1' /> {loginErrorMessage} 
                      </div>   
                </If>
                <Button type="primary" onClick={this.handleSubmit}>
                  <Translation>Sign in</Translation>
                </Button>
              </Card>
            </div>
          </If>
        </div>
      </div>
    );
  }
}
