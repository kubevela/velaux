import { Button, Card, Field, Form, Grid, Icon, Input } from '@alifd/next';
import React, { Component, Fragment } from 'react';

import { getDexConfig, getLoginType, isAdminConfigured, loginLocal } from '../../api/authentication';
import LogoWhite from '../../assets/kubevela-logo-white.png';
import Logo from '../../assets/kubevela-logo.png';
import { If } from '../../components/If';
import SwitchLanguage from '../../components/SwitchButton/index';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import './index.less';
import type { DexConfig } from '@velaux/data';
import { checkName, checkUserPassword } from '../../utils/common';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import EditPlatFormUserDialog from "../../layout/Header/components/EditPlatFormUserDialog";

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
  firstTimeLogin: boolean
  loginType: string;
  loginErrorMessage: string;
  loginLoading: boolean;
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
    };
  }

  componentDidMount() {
    this.isFirstLogin()
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
          firstTimeLogin: true
        })
      }
    })
  }
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
      const dexClientURL = `${issuer}/auth?client_id=${clientID}&redirect_uri=${newRedirectURl}&response_type=code&scope=openid+profile+email+offline_access&state=velaux`;
      window.location.href = dexClientURL;
    }
  };

  onCloseEditAdminUser = () => {
    this.setState({ firstTimeLogin: false });
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
    const { loginType, loginErrorMessage, loginLoading, firstTimeLogin } = this.state;
    const { Row, Col } = Grid;
    return (
      <Fragment>
        <div className="login-topbar">
          <Row className="nav-wrapper">
            <Col span="4" className="logo">
              <img src={LogoWhite} title={'Make shipping applications more enjoyable.'} />
            </Col>
            <div style={{ flex: '1 1 0%' }} />
            <div className="right">
              <div className="vela-item">
                <a title="KubeVela Documents" href="https://kubevela.io" target="_blank" rel="noopener noreferrer">
                  <AiOutlineQuestionCircle size={18} />
                </a>
              </div>
              <div className="vela-item">
                <SwitchLanguage />
              </div>
            </div>
          </Row>
        </div>

        <div className="full">
          <If condition={!firstTimeLogin}>
            <div className="login-wrapper">
              <If condition={loginType === 'dex'}>
                <div />
              </If>
              <If condition={loginType === 'local'}>
                <div className="login-card-wrapper">
                  <Card contentHeight={'auto'}>
                    <div className="logo-img-wrapper">
                      <img src={Logo} />
                    </div>
                    <h3 className="login-title-description">
                      <Translation>Make shipping applications more enjoyable</Translation>
                    </h3>
                    <Form
                      onSubmitCapture={(e) => {
                        e.preventDefault();
                      }}
                      onSubmit={this.handleSubmit}
                      {...formItemLayout}
                      field={this.field}
                    >
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
                                    The password should be 8-16 bits and contain at least one number and one letter
                                  </Translation>
                                ),
                              },
                            ],
                          })}
                        />
                      </FormItem>
                      <Button loading={loginLoading} type="primary" htmlType="submit" onClick={this.handleSubmit}>
                        <Translation>Sign in</Translation>
                      </Button>
                    </Form>
                    <If condition={loginErrorMessage}>
                      <div className="logo-error-wrapper">
                        <Icon type="warning1" /> <Translation>{loginErrorMessage}</Translation>
                      </div>
                    </If>
                  </Card>
                </div>
              </If>
            </div>
          </If>
          <If condition={firstTimeLogin}>
            <EditPlatFormUserDialog onClose={this.onCloseEditAdminUser} />
          </If>
        </div>
      </Fragment>
    );
  }
}
