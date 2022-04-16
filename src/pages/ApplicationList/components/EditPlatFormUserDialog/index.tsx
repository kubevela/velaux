import React, { Component, Fragment } from 'react';
import { Grid, Form, Input, Field, Button, Message } from '@b-design/ui';
import DrawerWithFooter from '../../../../components/Drawer';
import { updateUser } from '../../../../api/users';
import type { LoginUserInfo } from '../../../../interface/user';
import { checkName, checkUserPassword, checkUserEmail } from '../../../../utils/common';
import Translation from '../../../../components/Translation';
import i18n from '../../../../i18n';

type Props = {
  userInfo?: LoginUserInfo;
  onClose: () => void;
};

type State = {
  isLoading: boolean;
};

class EditPlatFormUserDialog extends Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      isLoading: false,
    };
  }

  componentDidMount() {
    const { userInfo = { name: '', alias: '', email: '' } } = this.props;
    const { name, alias, email } = userInfo;
    this.field.setValues({
      name,
      alias,
      email,
    });
  }

  onUpdateUser = async () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { name, alias, email, password } = values;
      const params = {
        name,
        alias,
        email,
        password,
      };
      this.setState({
        isLoading: true,
      });
      updateUser(params)
        .then((res) => {
          if (res) {
            Message.success(<Translation>Update user success</Translation>);
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
    return i18n.t('Edit User');
  }

  showClickButtons = () => {
    const { isLoading } = this.state;
    return [
      <Button type="primary" onClick={this.onUpdateUser} loading={isLoading}>
        {i18n.t('Update')}
      </Button>,
    ];
  };

  close = () => { };

  render() {
    const init = this.field.init;
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
        <DrawerWithFooter
          title={this.showTitle()}
          placement="right"
          width={800}
          extButtons={this.showClickButtons()}
          onClose={this.close}
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Name</Translation>} labelTextAlign="left" required>
                  <Input
                    name="name"
                    placeholder={i18n.t('Please enter').toString()}
                    maxLength={32}
                    disabled={true}
                    {...init('name', {
                      rules: [
                        {
                          required: true,
                          pattern: checkName,
                          message: <Translation>Please enter a valid name</Translation>,
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Alias</Translation>}>
                  <Input
                    name="alias"
                    placeholder={i18n.t('Please input the alias').toString()}
                    {...init('alias', {
                      rules: [
                        {
                          minLength: 2,
                          maxLength: 64,
                          message: 'Enter a string of 2 to 64 characters',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Password</Translation>} required>
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
                              Password should be 8-16 bits and contain at least one number and one
                              letter
                            </Translation>
                          ),
                        },
                        {
                          validator: (rule, value, callback) => {
                            const { password, ConfirmPassword } = this.field.getValues();
                            if (password && ConfirmPassword && password !== ConfirmPassword) {
                              callback(i18n.t('Inconsistent password entry twice'));
                            } else {
                              this.field.setError('password');
                              this.field.setError('ConfirmPassword');
                              callback();
                            }
                          },
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>

              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>ConfirmPassword</Translation>} required>
                  <Input
                    name="ConfirmPassword"
                    htmlType="password"
                    placeholder={i18n.t('Please input the password').toString()}
                    {...init('ConfirmPassword', {
                      rules: [
                        {
                          required: true,
                          pattern: checkUserPassword,
                          message: (
                            <Translation>
                              Password should be 8-16 bits and contain at least one number and one
                              letter
                            </Translation>
                          ),
                        },
                        {
                          validator: (rule, value, callback) => {
                            const { password, ConfirmPassword } = this.field.getValues();
                            if (password && ConfirmPassword && password !== ConfirmPassword) {
                              callback(i18n.t('Inconsistent password entry twice'));
                            } else {
                              this.field.setError('password');
                              this.field.setError('ConfirmPassword');
                              callback();
                            }
                          },
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
                          pattern: checkUserEmail,
                          message: <Translation>Please input a valid email</Translation>,
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
          </Form>
        </DrawerWithFooter>
      </Fragment>
    );
  }
}

export default EditPlatFormUserDialog;
