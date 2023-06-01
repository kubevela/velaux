import { Grid, Form, Input, Field, Button, Message, Select } from '@alifd/next';
import React from 'react';

import { updateProject } from '../../../../api/project';
import DrawerWithFooter from '../../../../components/Drawer';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { Project , User } from '@velaux/data';
import { checkName } from '../../../../utils/common';

type Props = {
  isEditGeneral: boolean;
  editGeneral: Project;
  userList: User[];
  onUpdateGeneral: () => void;
  onCloseGeneral: () => void;
};

type State = {
  loading: boolean;
};

class GeneralDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    const { isEditGeneral, editGeneral } = this.props;
    if (isEditGeneral && editGeneral) {
      const { name, alias, owner = { name: '' }, description } = editGeneral;
      this.field.setValues({
        name,
        alias,
        owner: owner.name,
        description,
      });
    }
  }

  onCloseGeneral = () => {
    this.props.onCloseGeneral();
  };

  onUpdateGeneral = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { isEditGeneral } = this.props;
      const { name, alias, description, owner } = values;
      const param = {
        name,
        alias,
        owner,
        description,
      };
      this.setState({ loading: true });
      if (isEditGeneral) {
        updateProject(param)
          .then((res) => {
            this.setState({ loading: false });
            if (res) {
              Message.success(<Translation>Project updated successfully</Translation>);
              this.props.onUpdateGeneral();
            }
          })
          .catch(() => {
            this.setState({ loading: false });
          });
      }
    });
  };

  getTitle = () => {
    return <Translation>Edit General</Translation>;
  };

  render() {
    const init = this.field.init;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const { isEditGeneral, userList } = this.props;
    const { loading } = this.state;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };

    const buttons = [
      <Button type="secondary" onClick={this.onCloseGeneral} style={{ marginRight: '16px' }}>
        <Translation>Cancel</Translation>
      </Button>,
      <Button type="primary" onClick={this.onUpdateGeneral} loading={loading}>
        <Translation>Update</Translation>
      </Button>,
    ];

    return (
      <React.Fragment>
        <DrawerWithFooter
          title={this.getTitle()}
          placement="right"
          width={800}
          onClose={this.onCloseGeneral}
          extButtons={buttons}
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Name</Translation>} labelTextAlign="left" required={true}>
                  <Input
                    name="name"
                    disabled={isEditGeneral ? true : false}
                    placeholder={i18n.t('Please enter').toString()}
                    maxLength={32}
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
                    placeholder={i18n.t('Please select a owner for this project').toString()}
                    filterLocal={true}
                    dataSource={userList}
                    style={{ width: '100%' }}
                    {...init('owner', {
                      rules: [
                        {
                          required: true,
                          pattern: checkName,
                          message: <Translation>Please select a owner for this project</Translation>,
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
                  <Input
                    name="description"
                    placeholder={i18n.t('Please input a description for the project').toString()}
                    {...init('description')}
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

export default GeneralDialog;
