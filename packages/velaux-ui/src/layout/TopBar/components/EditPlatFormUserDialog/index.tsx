import { Grid, Form, Input, Field, Message, Icon, Dialog } from '@alifd/next';
import React, { Component, Fragment } from 'react';
import { AiOutlineEye } from 'react-icons/ai';

import { updateUser } from '../../../../api/users';
import Translation from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { LoginUserInfo } from '../../../../interface/user';
import { checkUserPassword } from '../../../../utils/common';
import locale from '../../../../utils/locale';

type Props = {
  userInfo?: LoginUserInfo;
  onClose: () => void;
};

type State = {
  isLoading: boolean;
  isLookPassword: boolean;
};

class EditPlatFormUserDialog extends Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      isLoading: false,
      isLookPassword: false,
    };
  }

  onUpdateUser = async () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { userInfo } = this.props;
      const { email, password } = values;
      const params = {
        name: userInfo?.name || '',
        alias: userInfo?.alias || '',
        email,
        password,
      };
      this.setState({
        isLoading: true,
      });
      updateUser(params)
        .then((res) => {
          if (res) {
            Message.success(<Translation>User updated successfully</Translation>);
            this.props.onClose();
          }
        })
        .finally(() => {
          this.setState({
            isLoading: false,
          });
        });
    });
  };

  showTitle() {
    return i18n.t('Reset the password and email for the administrator account');
  }

  handleClickLook = () => {
    this.setState({
      isLookPassword: !this.state.isLookPassword,
    });
  };

  render() {
    const init = this.field.init;
    const { isLoading } = this.state;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };
    return (
      <Fragment>
        <Dialog
          v2
          visible={true}
          title={this.showTitle()}
          style={{ width: '600px' }}
          onOk={this.onUpdateUser}
          locale={locale().Dialog}
          footerActions={['ok']}
        >
          <Form loading={isLoading} {...formItemLayout} field={this.field}>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Password</Translation>} required>
                  <Input
                    name="password"
                    htmlType={this.state.isLookPassword ? 'passwordInput' : 'password'}
                    addonTextAfter={
                      <AiOutlineEye
                        style={{
                          cursor: 'pointer',
                        }}
                        onClick={this.handleClickLook}
                      />
                    }
                    placeholder={i18n.t('Please input the password').toString()}
                    {...init('password', {
                      rules: [
                        {
                          required: true,
                          pattern: checkUserPassword,
                          message: (
                            <Translation>
                              Password should be 8-16 bits and contain at least one number and one letter
                            </Translation>
                          ),
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Email</Translation>} required>
                  <Input
                    name="email"
                    placeholder={i18n.t('Please input a email').toString()}
                    {...init('email', {
                      rules: [
                        {
                          required: true,
                          format: 'email',
                          message: <Translation>Please input a valid email</Translation>,
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
          </Form>
        </Dialog>
      </Fragment>
    );
  }
}

export default EditPlatFormUserDialog;
