import { Button, Field, Form, Input } from '@alifd/next';
import classNames from 'classnames';
import React, { Component } from 'react';
import { AiOutlineExclamationCircle, AiOutlineQuestionCircle } from 'react-icons/ai';

import { getDexConfig, getLoginType, isAdminConfigured, loginLocal } from '../../api/authentication';
import { loadCustomisation } from '../../api/customisation';
import logoMark from '../../assets/KubeVela-01.svg';
import LogoWhite from '../../assets/kubevela-logo-white.png';
import Logo from '../../assets/kubevela-logo.png';
import SwitchLanguage from '../../components/SwitchButton/index';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import EditPlatFormUserDialog from '../../layout/Header/components/EditPlatFormUserDialog';
import type { Customisation } from '../../services/CustomisationService';
import { checkName, checkUserPassword } from '../../utils/common';
import { isLight, sidebarTheme } from '../../utils/theme';
import { DeliveryGraph } from './DeliveryGraph';
import './index.less';
import type { DexConfig } from '@velaux/data';

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
  dexConfig?: DexConfig;
  firstTimeLogin: boolean;
  loginType: string;
  loginErrorMessage: string;
  loginLoading: boolean;
  customisation: Customisation;
  // branded is set once the customisation is read, so the brand panel does
  // not flash the default colours first.
  branded: boolean;
};
export default class LoginPage extends Component<Props, State> {
  field: Field;

  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      firstTimeLogin: false,
      loginType: '',
      loginErrorMessage: '',
      loginLoading: false,
      customisation: {},
      branded: false,
    };
  }

  // The phone layout needs a device-width viewport; the rest of the app is desktop-only, so only this page sets one.
  viewport?: HTMLMetaElement;

  componentDidMount() {
    if (!document.querySelector('meta[name="viewport"]')) {
      this.viewport = document.createElement('meta');
      this.viewport.name = 'viewport';
      this.viewport.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(this.viewport);
    }
    this.isFirstLogin();
    this.onGetLoginType();
    loadCustomisation().then((customisation) => this.setState({ customisation, branded: true }));
  }

  componentWillUnmount() {
    this.viewport?.remove();
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
                this.ontDexConfig();
              }
            }
          );
        }
      })
      .catch();
  };
  isFirstLogin = () => {
    isAdminConfigured().then((res: any) => {
      if (res && !res.configured) {
        this.setState({
          firstTimeLogin: true,
        });
      }
    });
  };
  ontDexConfig = () => {
    getDexConfig()
      .then((res) => {
        if (res) {
          this.setState(
            {
              dexConfig: res,
            },
            () => {
              this.onGetDexCode();
            }
          );
        }
      })
      .catch();
  };

  handleSubmit = () => {
    if (this.state.loginLoading) {
      return;
    }
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      this.setState({ loginLoading: true, loginErrorMessage: '' });
      const { username, password } = values;
      const params = {
        username: username,
        password,
      };
      loginLocal(params)
        .then((res: any) => {
          if (res && res.accessToken) {
            localStorage.setItem('token', res.accessToken);
            localStorage.setItem('refreshToken', res.refreshToken);
            this.props.history.push('/');
          }
        })
        .catch((err) => {
          let customErrorMessage = '';
          if (err.BusinessCode) {
            customErrorMessage = `${err.Message}(${err.BusinessCode})`;
          } else {
            customErrorMessage = 'Please check the network or contact the administrator!';
          }
          this.setState({
            loginErrorMessage: customErrorMessage,
            loginLoading: false,
          });
        });
    });
  };
  onGetDexCode = () => {
    if (this.state.dexConfig) {
      const { clientID, issuer, redirectURL } = this.state.dexConfig;
      const newRedirectURl = encodeURIComponent(redirectURL);
      const dexClientURL = `${issuer}/auth?client_id=${clientID}&redirect_uri=${newRedirectURl}&response_type=code&scope=openid+profile+email+groups+offline_access&state=velaux`;
      window.location.href = dexClientURL;
    }
  };

  onCloseEditAdminUser = () => {
    this.setState({ firstTimeLogin: false });
  };

  render() {
    const FormItem = Form.Item;
    const init = this.field.init;
    const { loginType, loginErrorMessage, loginLoading, firstTimeLogin, customisation, branded } = this.state;
    // The brand panel takes the sidebar's colours and logo, as the app does.
    const theme = sidebarTheme(customisation.sidebarColor, customisation.accentColor);
    const light = !!customisation.sidebarColor && isLight(customisation.sidebarColor);
    const logoSrc = customisation.logoURL || (light ? Logo : LogoWhite);
    return (
      <div className="login-page">
        <div className={classNames('login-brand', { branded })} style={theme as React.CSSProperties}>
          <img
            src={logoSrc}
            className={classNames('login-brand-logo', { 'login-logo-plate': customisation.logoURL && !light })}
            title={'Platform Engineering. Simplified.'}
          />
          <div className="login-brand-hero">
            <DeliveryGraph />
            <h2 className="login-brand-tagline">
              <Translation>Platform Engineering.</Translation>{' '}
              <span className="login-brand-accent">
                <Translation>Simplified.</Translation>
              </span>
            </h2>
          </div>
          <div className="login-brand-footer">
            <a
              className="login-brand-item"
              title="KubeVela Documents"
              href="https://kubevela.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AiOutlineQuestionCircle size={18} />
              <span>
                <Translation>Documentation</Translation>
              </span>
            </a>
            <div className="login-brand-item">
              <SwitchLanguage />
            </div>
          </div>
        </div>

        <div className="login-main">
          {!firstTimeLogin && loginType === 'local' && (
            <div className="login-form">
              <h1 className="login-title">
                <Translation>Sign in</Translation>
              </h1>
              <p className="login-subtitle">
                <Translation>Sign in with your account to continue</Translation>
              </p>
              <Form
                onSubmitCapture={(e) => {
                  e.preventDefault();
                }}
                onSubmit={this.handleSubmit}
                field={this.field}
                labelAlign="top"
              >
                <FormItem label={<Translation>Username</Translation>}>
                  <Input
                    name="username"
                    size="large"
                    autoFocus
                    autoComplete="username"
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
                <FormItem label={<Translation>Password</Translation>}>
                  <Input
                    name="password"
                    size="large"
                    htmlType="password"
                    autoComplete="current-password"
                    placeholder={i18n.t('Please input the password').toString()}
                    {...init('password', {
                      rules: [
                        {
                          required: true,
                          pattern: checkUserPassword,
                          message: (
                            <Translation>
                              The password should be 8-16 bits and contain at least one number and one letter
                            </Translation>
                          ),
                        },
                      ],
                    })}
                  />
                </FormItem>
                {loginErrorMessage && (
                  <div className="login-error" role="alert">
                    <AiOutlineExclamationCircle size={16} />
                    <Translation>{loginErrorMessage}</Translation>
                  </div>
                )}
                <Button className="login-submit" size="large" loading={loginLoading} type="primary" htmlType="submit">
                  <Translation>Sign in</Translation>
                </Button>
              </Form>
            </div>
          )}
          {firstTimeLogin && <EditPlatFormUserDialog onClose={this.onCloseEditAdminUser} />}
          {customisation.logoURL && (
            <a className="powered-by" href="https://kubevela.io" target="_blank" rel="noopener noreferrer">
              <Translation>Powered by</Translation>
              <img src={logoMark} alt="" />
              KubeVela
            </a>
          )}
        </div>
      </div>
    );
  }
}
