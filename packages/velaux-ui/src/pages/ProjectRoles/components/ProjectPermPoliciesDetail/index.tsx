import { Grid, Form, Input, Field, Checkbox, Button, Message } from '@alifd/next';
import React, { Component, Fragment } from 'react';

import { createProjectRoles, updateProjectRoles } from '../../../../api/project';
import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { ProjectRoleBase , PermissionBase } from '@velaux/data';
import { checkName } from '../../../../utils/common';
import './index.less';

type Props = {
  projectName: string;
  projectRoles: ProjectRoleBase[];
  activeRoleName: string;
  activeRoleItem: ProjectRoleBase;
  isCreateProjectRoles: boolean;
  projectPermissions: PermissionBase[];
  onCreate: (activeRoleItem: string) => void;
};

type State = {
  loading: boolean;
};

const { Group: CheckboxGroup } = Checkbox;

class ProjectPermPoliciesDetail extends Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    const { isCreateProjectRoles } = nextProps;
    if (isCreateProjectRoles) {
      this.field.setValues({
        name: '',
        alias: '',
        permissions: [],
      });
    } else {
      if (nextProps.activeRoleItem !== this.props.activeRoleItem) {
        this.field.setValues({
          name: nextProps.activeRoleItem.name || '',
          alias: nextProps.activeRoleItem.alias || '',
          permissions: this.initPermPoliciesStatus(nextProps.activeRoleItem),
        });
      }
    }
  }

  initPermPoliciesStatus = (activeItem: ProjectRoleBase) => {
    if (activeItem) {
      return (activeItem.permissions || []).map((item: { name: string }) => item.name);
    } else {
      return [];
    }
  };

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { isCreateProjectRoles, projectName, activeRoleName } = this.props;
      const { name, alias, permissions } = values;
      const queryData = {
        projectName,
        roleName: activeRoleName,
      };
      const param = {
        name,
        alias,
        permissions,
      };
      this.setState({ loading: true });
      if (isCreateProjectRoles) {
        createProjectRoles(queryData, param)
          .then((res: { name: string }) => {
            this.setState({ loading: false });
            if (res) {
              Message.success(<Translation>Create role success</Translation>);
              this.props.onCreate(res.name);
            }
          })
          .finally(() => {
            this.setState({ loading: false });
          });
      } else {
        updateProjectRoles(queryData, param)
          .then((res: { name: string }) => {
            this.setState({ loading: false });
            if (res) {
              Message.success(<Translation>Update role success</Translation>);
              this.props.onCreate(res.name);
            }
          })
          .finally(() => {
            this.setState({ loading: false });
          });
      }
    });
  };

  renderSubmitButton = () => {
    const { isCreateProjectRoles, projectName } = this.props;
    const name = this.field.getValue('name');
    if (isCreateProjectRoles) {
      return (
        <Permission request={{ resource: `project:${projectName}/role:*`, action: 'create' }} project={projectName}>
          <Button className="create-auth-btn" type="primary" onClick={this.onSubmit}>
            <Translation>{'Create'}</Translation>
          </Button>
        </Permission>
      );
    } else {
      return (
        <Permission
          request={{ resource: `project:${projectName}/role:${name}`, action: 'update' }}
          project={projectName}
        >
          <Button className="create-auth-btn" type="primary" onClick={this.onSubmit}>
            <Translation>{'Update'}</Translation>
          </Button>
        </Permission>
      );
    }
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
    const { projectRoles, isCreateProjectRoles, projectPermissions } = this.props;
    const permissions = projectPermissions.map((p) => {
      return {
        label: p.alias || p.name,
        value: p.name,
      };
    });
    return (
      <Fragment>
        <If condition={projectRoles && projectRoles.length === 0 && !isCreateProjectRoles}>
          <div className="project-role-empty-wrapper">
            <Empty />
          </div>
        </If>
        <If condition={(projectRoles && projectRoles.length !== 0) || isCreateProjectRoles}>
          <div className="auth-list-wrapper">
            <Form {...formItemLayout} field={this.field} className="auth-form-content">
              <Row>
                <Col span={12} style={{ padding: '16px 16px 0 30px' }}>
                  <FormItem
                    label={<Translation>Name</Translation>}
                    labelAlign="left"
                    required
                    className="font-weight-400"
                  >
                    <Input
                      name="name"
                      placeholder={i18n.t('Please input the rule name').toString()}
                      maxLength={32}
                      disabled={isCreateProjectRoles ? false : true}
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
                <Col span={12} style={{ padding: '16px 16px 0 30px' }}>
                  <FormItem label={<Translation>Alias</Translation>} labelAlign="left" className="font-weight-400">
                    <Input
                      name="alias"
                      placeholder={i18n.t('Please input the role alias').toString()}
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
                <Col span={24} style={{ padding: '0 16px 16px 30px' }}>
                  <FormItem
                    label={<Translation>Permissions</Translation>}
                    labelAlign="left"
                    className="font-weight-400 permPolicies-wrapper"
                    required={true}
                  >
                    <CheckboxGroup
                      dataSource={permissions}
                      {...init('permissions', {
                        rules: [
                          {
                            required: true,
                            type: 'array',
                            message: 'Please select at last on permission',
                          },
                        ],
                      })}
                    />
                  </FormItem>
                </Col>
              </Row>
            </Form>
            {this.renderSubmitButton()}
          </div>
        </If>
      </Fragment>
    );
  }
}

export default ProjectPermPoliciesDetail;
