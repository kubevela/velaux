import React from 'react';
import { If } from 'tsx-control-statements/components';
import { Grid, Form, Input, Field, Button, Select, Message } from '@b-design/ui';
import DrawerWithFooter from '../../../../components/Drawer';
import UISchema from '../../../../components/UISchema';
import Group from '../../../../extends/Group';
import { detailComponentDefinition } from '../../../../api/application';
import { createConfigType } from '../../../../api/integration';
import type { Rule } from '@alifd/field';
import type { ComponentDefinitionsBase } from '../../../../interface/application';
import type { Project } from '../../../../interface/project';
import type { DefinitionDetail } from '../../../../interface/application';
import { checkName } from '../../../../utils/common';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import { getSelectLabel } from '../../../../utils/utils';
import i18n from '../../../../i18n';

type Props = {
  visible: boolean;
  configType: string;
  projects: Project[];
  componentDefinitions: ComponentDefinitionsBase[];
  onCreate: () => void;
  onClose: () => void;
};

type State = {
  project?: string;
  loading: boolean;
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
  createLoading: boolean;
};

class CreateIntegration extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
      definitionLoading: false,
      createLoading: false,
    };
    this.field = new Field(this);
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    const { componentDefinitions } = this.props;
    if (componentDefinitions && componentDefinitions.length === 1) {
      this.field.setValues({
        componentType: componentDefinitions[0].name,
      });
      this.onDetailsComponentDefinition(componentDefinitions[0].name);
    }
  }

  onDetailsComponentDefinition = (value: string, callback?: () => void) => {
    this.setState({ definitionLoading: true });
    detailComponentDefinition({ name: value })
      .then((re) => {
        if (re) {
          this.setState({ definitionDetail: re });
          if (callback) {
            callback();
          }
        }
      })
      .finally(() => {
        this.setState({ definitionLoading: false });
      });
  };

  onClose = () => {
    this.props.onClose();
  };

  onCreate = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { configType, componentDefinitions } = this.props;
      const { name, alias, project, description, componentType, properties } = values;
      const params = {
        alias,
        name,
        description,
        project: project,
        componentType,
        properties: JSON.stringify(properties),
      };

      if (!componentType && componentDefinitions.length == 1) {
        params.componentType = componentDefinitions[0].name;
      }

      this.setState({ createLoading: true });
      const queryData = { configType };
      createConfigType(queryData, params)
        .then((res) => {
          if (res) {
            Message.success(<Translation>Integration config created successfully</Translation>);
            this.props.onCreate();
          }
        })
        .finally(() => {
          this.setState({ createLoading: false });
        });
    });
  };

  getTitle = () => {
    return `New ${this.props.configType}`;
  };

  removeProperties = () => {
    this.field.remove('properties');
    this.setState({ definitionDetail: undefined });
  };

  render() {
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const init = this.field.init;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };
    const { projects, componentDefinitions } = this.props;
    const { createLoading, definitionDetail, definitionLoading } = this.state;
    const buttons = [
      <Button type="secondary" onClick={this.onClose} style={{ marginRight: '16px' }}>
        <Translation>Cancel</Translation>
      </Button>,
      <Button type="primary" onClick={this.onCreate} loading={createLoading}>
        <Translation>Create</Translation>
      </Button>,
    ];
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };

    return (
      <React.Fragment>
        <DrawerWithFooter
          title={this.getTitle()}
          placement="right"
          width={800}
          onClose={this.onClose}
          extButtons={buttons}
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem
                  label={<Translation>Name</Translation>}
                  labelTextAlign="left"
                  required={true}
                >
                  <Input
                    name="name"
                    placeholder={i18n.t('Please enter').toString()}
                    maxLength={32}
                    {...init('name', {
                      rules: [
                        {
                          required: false,
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
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem
                  label={<Translation>Project</Translation>}
                  help={
                    <span>
                      <Translation>
                        If this configuration is not specified, it will take effect globally
                      </Translation>
                    </span>
                  }
                >
                  <Select
                    name="project"
                    hasClear
                    showSearch
                    placeholder={i18n.t('Please select').toString()}
                    filterLocal={true}
                    dataSource={getSelectLabel(projects)}
                    style={{ width: '100%' }}
                    {...init('project', {
                      rules: [
                        {
                          required: false,
                          message: 'Please select project',
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
                    placeholder={i18n.t('Please enter').toString()}
                    {...init('description')}
                  />
                </FormItem>
              </Col>
            </Row>
            <If condition={componentDefinitions.length > 1}>
              <Row>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <FormItem
                    label={
                      <Translation className="font-size-14 font-weight-bold color333">
                        ConfigType
                      </Translation>
                    }
                    required={true}
                  >
                    <Select
                      locale={locale().Select}
                      showSearch
                      className="select"
                      placeholder={i18n.t('Please select').toString()}
                      {...init(`componentType`, {
                        initValue: '',
                        rules: [
                          {
                            required: true,
                            message: i18n.t('Please select').toString(),
                          },
                        ],
                      })}
                      dataSource={getSelectLabel(componentDefinitions)}
                      onChange={(item: string) => {
                        this.removeProperties();
                        this.field.setValue('componentType', item);
                        this.onDetailsComponentDefinition(item);
                      }}
                    />
                  </FormItem>
                </Col>
              </Row>
            </If>

            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <Group
                  title={i18n.t('Config Properties')}
                  closed={false}
                  loading={definitionLoading}
                  required={true}
                  hasToggleIcon={true}
                >
                  <FormItem required={true}>
                    <If condition={definitionDetail && definitionDetail.uiSchema}>
                      <UISchema
                        {...init(`properties`, {
                          rules: [
                            {
                              validator: validator,
                              message: i18n.t('Please check app deploy properties'),
                            },
                          ],
                        })}
                        uiSchema={definitionDetail && definitionDetail.uiSchema}
                        ref={this.uiSchemaRef}
                        mode="new"
                      />
                    </If>
                  </FormItem>

                  <If condition={!definitionDetail}>
                    <Message type="notice">
                      <Translation>Please select config type first.</Translation>
                    </Message>
                  </If>
                </Group>
              </Col>
            </Row>
          </Form>
        </DrawerWithFooter>
      </React.Fragment>
    );
  }
}

export default CreateIntegration;
