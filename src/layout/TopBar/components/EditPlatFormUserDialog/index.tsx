import React, { Component, Fragment } from 'react';
import { Grid, Form, Input, Field, Button, Message, Icon } from '@b-design/ui';
import DrawerWithFooter from '../../../../components/Drawer';
import { updateUser } from '../../../../api/users';
import type { LoginUserInfo } from '../../../../interface/user';
import { checkUserPassword, checkUserEmail } from '../../../../utils/common';
import Translation from '../../../../components/Translation';
import i18n from '../../../../i18n';

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

  showClickButtons = () => {
    const { isLoading } = this.state;
    return [
      <Button type="primary" onClick={this.onUpdateUser} loading={isLoading}>
        {i18n.t('Update')}
      </Button>,
    ];
  };

  close = () => { };

  showPasswordLabel = () => {
    return (
      <div className="inline-block">
        <span>
          <Translation>Password</Translation>
        </span>
        <span className="cursor-pointer" onClick={this.handleClickLook}>
          <Icon type="eye-fill"></Icon>
        </span>
      </div>
    );
  };

  handleClickLook = () => {
    this.setState({
      isLookPassword: !this.state.isLookPassword,
    });
  };

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
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={this.showPasswordLabel()} required>
                  <Input
                    name="password"
                    htmlType={this.state.isLookPassword ? 'passwordInput' : 'password'}
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
