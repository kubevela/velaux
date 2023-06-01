import { Grid, Form, Input, Field, Button, Message, Select } from '@alifd/next';
import React from 'react';

import { createProject, updateProject } from '../../../../api/project';
import DrawerWithFooter from '../../../../components/Drawer';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { Project , User } from '@velaux/data';
import { checkName } from '../../../../utils/common';

type Props = {
  visible: boolean;
  userList: User[];
  isEditProject: boolean;
  editProjectItem: Project;
  onCreate: () => void;
  onCloseCreate: () => void;
};

type State = {
  loading: boolean;
};

class CreateConfig extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    const { isEditProject, editProjectItem } = this.props;
    if (isEditProject && editProjectItem) {
      const { name, alias, owner = { name: '' }, description } = editProjectItem;
      this.field.setValues({
        name,
        alias,
        owner: owner.name,
        description,
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
      const { isEditProject } = this.props;
      const { name, alias, description, owner } = values;
      const param = {
        name,
        alias,
        owner,
        description,
      };
      this.setState({ loading: true });
      if (isEditProject) {
        updateProject(param)
          .then((res) => {
            this.setState({ loading: false });
            if (res) {
              Message.success(<Translation>Update project success</Translation>);
              this.props.onCreate();
            }
          })
          .catch(() => {
            this.setState({ loading: false });
          });
      } else {
        createProject(param)
          .then((res) => {
            this.setState({ loading: false });
            if (res) {
              Message.success(<Translation>Create project success</Translation>);
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
    const { isEditProject } = this.props;
    if (isEditProject) {
      return <Translation>Edit Project</Translation>;
    } else {
      return <Translation>New Project</Translation>;
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

    const { isEditProject, userList = [] } = this.props;
    const buttons = [
      <Button type="secondary" onClick={this.onCloseCreate} style={{ marginRight: '16px' }}>
        <Translation>Cancel</Translation>
      </Button>,
      <Button type="primary" onClick={this.onCreate} loading={loading}>
        <If condition={isEditProject}>
          <Translation>Update</Translation>
        </If>
        <If condition={!isEditProject}>
          <Translation>Create</Translation>
        </If>
      </Button>,
    ];

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
                    disabled={isEditProject ? true : false}
                    {...init('name', {
                      rules: [
                        {
                          required: true,
                          pattern: checkName,
                          message: <Translation>Please enter a project name</Translation>,
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
                <FormItem label={<Translation>Owner</Translation>}>
                  <Select
                    name="owner"
                    hasClear
                    showSearch
                    placeholder={i18n.t('Please enter').toString()}
                    filterLocal={true}
                    dataSource={userList}
                    style={{ width: '100%' }}
                    {...init('owner', {
                      rules: [
                        {
                          required: false,
                          pattern: checkName,
                          message: <Translation>Please enter a valid username</Translation>,
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Description</Translation>}>
                  <Input name="description" placeholder={i18n.t('Please enter').toString()} {...init('description')} />
                </FormItem>
              </Col>
            </Row>
          </Form>
        </DrawerWithFooter>
      </React.Fragment>
    );
  }
}

export default CreateConfig;
