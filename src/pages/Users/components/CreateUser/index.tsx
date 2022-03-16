import React from 'react';
import { Grid, Form, Input, Field, Button } from '@b-design/ui';
import DrawerWithFooter from '../../../../components/Drawer';
import { checkUserPassWord, checkUserEmail } from '../../../../utils/common';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import i18n from '../../../../i18n';

type Props = {
  visible: boolean;
  isEditUser: boolean;
  editUser: any;
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
      const { alias, createTime, email, lastLoginTime, name } = editUser;
      this.field.setValues({
        name,
        alias,
        createTime,
        email,
        lastLoginTime,
      });
    }
  }

  onClose = () => {
    this.props.onClose();
  };
  //Todo
  onCreate = () => {
    this.props.onCreate();
  };

  showTitle = () => {
    const { isEditUser } = this.props;
    if (isEditUser) {
      return <Translation>Edit User</Translation>;
    } else {
      return <Translation>New User</Translation>;
    }
  };

  render() {
    const init = this.field.init;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const { loading } = this.state;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };

    const Buttons = [
      <Button type="secondary" onClick={this.onClose} style={{ marginRight: '16px' }}>
        <Translation>Cancel</Translation>
      </Button>,
      <Button type="primary" onClick={this.onCreate} loading={loading}>
        <Translation>Create</Translation>
      </Button>,
    ];

    return (
      <React.Fragment>
        <DrawerWithFooter
          title={this.showTitle()}
          placement="right"
          width={800}
          onClose={this.onClose}
          extButtons={Buttons}
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Name</Translation>} labelTextAlign="left" required>
                  <Input
                    name="name"
                    placeholder={i18n.t('Please enter').toString()}
                    maxLength={32}
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
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Password</Translation>} required>
                  <Input
                    name="password"
                    placeholder={i18n.t('Please enter').toString()}
                    {...init('password', {
                      rules: [
                        {
                          required: true,
                          pattern: checkUserPassWord,
                          message: <Translation>Please enter a valid user password</Translation>,
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Email</Translation>} required>
                  <Input
                    name="email"
                    placeholder={i18n.t('Please enter').toString()}
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
