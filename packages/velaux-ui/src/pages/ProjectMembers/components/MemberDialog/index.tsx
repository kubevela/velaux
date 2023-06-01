import { Grid, Form, Input, Field, Button, Message, Select } from '@alifd/next';
import React from 'react';

import { createProjectUsers, updateProjectUser } from '../../../../api/project';
import DrawerWithFooter from '../../../../components/Drawer';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { ProjectMember, ProjectRoleBase } from '@velaux/data';
import { checkName } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { getSelectLabel } from '../../../../utils/utils';

type Props = {
  visible: boolean;
  projectRoles: ProjectRoleBase[];
  projectName: string;
  isEditMember: boolean;
  editMember: ProjectMember;
  onCreate: () => void;
  onClose: () => void;
};

type State = {
  loading: boolean;
};

class MemberDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    const { isEditMember, editMember } = this.props;
    if (isEditMember && editMember) {
      const { name, createTime, userRoles } = editMember;
      this.field.setValues({
        userName: name,
        createTime,
        userRoles,
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
      const { isEditMember, projectName } = this.props;
      const { userName, userRoles } = values;

      const params = {
        userRoles,
        userName,
      };
      const queryData = {
        projectName,
        userName,
      };
      if (isEditMember) {
        updateProjectUser(queryData, params).then((res) => {
          if (res) {
            Message.success(<Translation>Update member success</Translation>);
            this.props.onCreate();
          }
        });
      } else {
        createProjectUsers({ projectName }, params).then((res) => {
          if (res) {
            Message.success(<Translation>Create member success</Translation>);
            this.props.onCreate();
          }
        });
      }
    });
  };

  showTitle = () => {
    const { isEditMember } = this.props;
    if (isEditMember) {
      return <Translation>Edit Member</Translation>;
    } else {
      return <Translation>Add Member</Translation>;
    }
  };

  showClickButtons = () => {
    const { isEditMember } = this.props;
    const { loading } = this.state;
    let createEle;
    if (isEditMember) {
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
    const { isEditMember, projectRoles } = this.props;

    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };

    const rolesList = getSelectLabel(projectRoles);
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
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Username</Translation>} labelTextAlign="left" required>
                  <Input
                    name="userName"
                    placeholder={i18n.t('Please enter').toString()}
                    maxLength={32}
                    disabled={isEditMember ? true : false}
                    {...init('userName', {
                      rules: [
                        {
                          required: true,
                          pattern: checkName,
                          message: <Translation>Please enter a valid userName</Translation>,
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>UserRoles</Translation>} required>
                  <Select
                    {...init(`userRoles`, {
                      rules: [
                        {
                          required: true,
                          message: 'Please select userRoles',
                        },
                      ],
                    })}
                    locale={locale().Select}
                    mode="tag"
                    dataSource={rolesList}
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

export default MemberDialog;
