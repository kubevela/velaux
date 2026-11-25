import { Grid, Form, Input, Field, Button, Message } from '@alifd/next';
import React from 'react';

import ModalWithFooter from '../ModalWithFooter';
import { PermissionPicker } from '../RolePermissions';
import { Translation } from '../Translation';
import i18n from '../../i18n';
import type { PermissionLike } from '../../utils/permissionMatrix';
import { checkName } from '../../utils/common';

// RoleValues is what the dialog submits.
export type RoleValues = { name: string; alias?: string; permissions: string[] };

type Props = {
  // role is the role being edited; without it the dialog creates one.
  role?: { name: string; alias?: string; permissions?: PermissionLike[] };
  permissions: PermissionLike[];
  save: (values: RoleValues, isEdit: boolean) => Promise<any>;
  onSaved: () => void;
  onClose: () => void;
};

type State = {
  loading: boolean;
};

// RoleDialog creates or edits a platform or project role: its name, alias and permissions.
class RoleDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = { loading: false };
  }

  componentDidMount() {
    const { role } = this.props;
    if (role) {
      this.field.setValues({
        name: role.name,
        alias: role.alias,
        permissions: (role.permissions || []).map((p) => p.name),
      });
    }
  }

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const isEdit = !!this.props.role;
      const { name, alias, permissions } = values;
      this.setState({ loading: true });
      this.props
        .save({ name, alias, permissions }, isEdit)
        .then((res) => {
          if (res) {
            Message.success(<Translation>{isEdit ? 'Update role success' : 'Create role success'}</Translation>);
            this.props.onSaved();
          }
        })
        .finally(() => {
          this.setState({ loading: false });
        });
    });
  };

  render() {
    const init = this.field.init;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const isEdit = !!this.props.role;
    const buttons = [
      <Button key="cancel" type="secondary" onClick={this.props.onClose}>
        <Translation>Cancel</Translation>
      </Button>,
      <Button key="ok" type="primary" onClick={this.onSubmit} loading={this.state.loading}>
        <Translation>{isEdit ? 'Update' : 'Create'}</Translation>
      </Button>,
    ];
    return (
      <ModalWithFooter
        title={<Translation>{isEdit ? 'Edit Role' : 'New Role'}</Translation>}
        width={640}
        onClose={this.props.onClose}
        extButtons={buttons}
      >
        <Form field={this.field} labelAlign="top">
          <Row gutter={16}>
            <Col span={12}>
              <FormItem label={<Translation>Name</Translation>} required>
                <Input
                  name="name"
                  placeholder={i18n.t('Please enter').toString()}
                  maxLength={32}
                  disabled={isEdit}
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
            <Col span={12}>
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
          <FormItem required>
            <PermissionPicker
              permissions={this.props.permissions}
              {...init('permissions', {
                rules: [
                  {
                    required: true,
                    type: 'array',
                    message: i18n.t('Please select at last one permission').toString(),
                  },
                ],
              })}
            />
          </FormItem>
        </Form>
      </ModalWithFooter>
    );
  }
}

export default RoleDialog;
