import { Grid, Form, Input, Field, Button, Message, Select } from '@alifd/next';
import React from 'react';

import { createRole, updateRole } from '../../../../api/roles';
import DrawerWithFooter from '../../../../components/Drawer';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { RolesBase , PermissionBase } from '@velaux/data';
import { checkName } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { getSelectLabel } from '../../../../utils/utils';

type Props = {
  visible: boolean;
  isEditRole: boolean;
  editRoleItem: RolesBase;
  permissions: PermissionBase[];
  onCreate: () => void;
  onCloseCreate: () => void;
};

type State = {
  loading: boolean;
};

class RolesDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    const { isEditRole, editRoleItem } = this.props;
    if (isEditRole && editRoleItem) {
      const { name, alias, permissions } = editRoleItem;
      const permissionNames = permissions?.map((item) => {
        return item.name;
      });
      this.field.setValues({
        name,
        alias,
        permissions: permissionNames,
      });
    }
  }

  onCloseCreate = () => {
    this.props.onCloseCreate();
  };

  onCreate = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { isEditRole } = this.props;
      const { name, alias, permissions } = values;
      const param = {
        name,
        alias,
        permissions,
      };
      this.setState({ loading: true });
      if (isEditRole) {
        updateRole(param)
          .then((res) => {
            this.setState({ loading: false });
            if (res) {
              Message.success(<Translation>Update role success</Translation>);
              this.props.onCreate();
            }
          })
          .catch(() => {
            this.setState({ loading: false });
          });
      } else {
        createRole(param)
          .then((res) => {
            this.setState({ loading: false });
            if (res) {
              Message.success(<Translation>Create role success</Translation>);
              this.props.onCreate();
            }
          })
          .catch(() => {
            this.setState({ loading: false });
          });
      }
    });
  };

  getTitle = () => {
    const { isEditRole } = this.props;
    if (isEditRole) {
      return <Translation>Edit Role</Translation>;
    } else {
      return <Translation>New Role</Translation>;
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

    const { isEditRole, permissions } = this.props;
    const buttons = [
      <Button type="secondary" onClick={this.onCloseCreate} style={{ marginRight: '16px' }}>
        <Translation>Cancel</Translation>
      </Button>,
      <Button type="primary" onClick={this.onCreate} loading={loading}>
        <If condition={isEditRole}>
          <Translation>Update</Translation>
        </If>
        <If condition={!isEditRole}>
          <Translation>Create</Translation>
        </If>
      </Button>,
    ];

    const permPoliciesList = getSelectLabel(permissions);
    return (
      <React.Fragment>
        <DrawerWithFooter
          title={this.getTitle()}
          placement="right"
          width={800}
          onClose={this.onCloseCreate}
          extButtons={buttons}
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Name</Translation>} labelTextAlign="left" required={true}>
                  <Input
                    name="name"
                    placeholder={i18n.t('Please enter').toString()}
                    maxLength={32}
                    disabled={isEditRole ? true : false}
                    {...init('name', {
                      rules: [
                        {
                          required: true,
                          pattern: checkName,
                          message: <Translation>Please enter a roles name</Translation>,
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
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Permissions</Translation>} required={true}>
                  <Select
                    {...init(`permissions`, {
                      rules: [
                        {
                          required: true,
                          message: i18n.t('Please select at last one permission'),
                        },
                      ],
                    })}
                    locale={locale().Select}
                    mode="tag"
                    dataSource={permPoliciesList}
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

export default RolesDialog;
