import React from 'react';
import { Grid, Form, Input, Field, Button, Message } from '@b-design/ui';
import DrawerWithFooter from '../../../../components/Drawer';
import { checkUserPassWord, checkUserEmail } from '../../../../utils/common';
import Translation from '../../../../components/Translation';
import { createUser, updateUser } from '../../../../api/users';
import { checkName } from '../../../../utils/common';
import { User } from '../../../../interface/user';
import { If } from 'tsx-control-statements/components';
import i18n from '../../../../i18n';

type Props = {
  visible: boolean;
  isEditUser: boolean;
  editUser: User;
  onCreate: () => void;
  onClose: () => void;
};

type State = {
  loading: boolean;
};

class CreateUser extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    const { isEditUser, editUser } = this.props;
    if (isEditUser && editUser) {
      const { alias, createTime, email, lastLoginTime, password, name } = editUser;
      this.field.setValues({
        name,
        alias,
        createTime,
        password,
        email,
        lastLoginTime,
      });
    }
  }

  onClose = () => {
    this.props.onClose();
  };

  onCreate = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { isEditUser, editUser } = this.props;
      const { name, alias, email, password } = values;

      const params = {
        name,
        alias,
        email,
        password,
      };

      if (isEditUser && editUser.email) {
        delete params.email;
      }

      if (isEditUser) {
        updateUser(params).then((res) => {
          if (res) {
            Message.success(<Translation>update user success</Translation>);
            this.props.onCreate();
          }
        });
      } else {
        createUser(params).then((res) => {
          if (res) {
            Message.success(<Translation>create user success</Translation>);
            this.props.onCreate();
          }
        });
      }
    });
  };

  showTitle = () => {
    const { isEditUser } = this.props;
    if (isEditUser) {
      return <Translation>Edit User</Translation>;
    } else {
      return <Translation>New User</Translation>;
    }
  };

  showClickButtons = () => {
    const { isEditUser } = this.props;
    const { loading } = this.state;
    let createEle;
    if (isEditUser) {
      createEle = (
        <Button type="primary" onClick={this.onCreate} loading={loading}>
          <Translation>Update</Translation>
        </Button>
      );
    } else {
      createEle = (
        <Button type="primary" onClick={this.onCreate} loading={loading}>
          <Translation>Create</Translation>
        </Button>
      );
    }

    return [
      <Button type="secondary" onClick={this.onClose} style={{ marginRight: '16px' }}>
        <Translation>Cancel</Translation>
      </Button>,
      createEle,
    ];
  };

  render() {
    const init = this.field.init;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const { isEditUser, editUser } = this.props;

    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };

    return (
      <React.Fragment>
        <DrawerWithFooter
          title={this.showTitle()}
          placement="right"
          width={800}
          onClose={this.onClose}
          extButtons={this.showClickButtons()}
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Name</Translation>} labelTextAlign="left" required>
                  <Input
                    name="name"
                    placeholder={i18n.t('Please enter').toString()}
                    maxLength={32}
                    disabled={isEditUser ? true : false}
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
                    placeholder={i18n.t('Please enter').toString()}
                    {...init('alias', {
                      rules: [
                        {
                          minLength: 2,
                          maxLength: 64,
                          message: 'Enter a string of 2 to 64 characters.',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <If condition={!isEditUser}>
                <Col span={12} style={{ padding: '0 8px' }}>
                  <FormItem label={<Translation>Password</Translation>} required>
                    <Input
                      name="password"
                      htmlType="password"
                      placeholder={i18n.t('Please enter').toString()}
                      {...init('password', {
                        rules: [
                          {
                            required: true,
                            pattern: checkUserPassWord,
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
              </If>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Email</Translation>} required>
                  <Input
                    name="email"
                    placeholder={i18n.t('Please enter').toString()}
                    disabled={isEditUser && editUser.email ? true : false}
                    {...init('email', {
                      rules: [
                        {
                          required: true,
                          pattern: checkUserEmail,
                          message: <Translation>Please enter a valid email </Translation>,
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
          </Form>
        </DrawerWithFooter>
      </React.Fragment>
    );
  }
}

export default CreateUser;
