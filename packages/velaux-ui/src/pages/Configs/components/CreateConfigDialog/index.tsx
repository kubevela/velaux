import type { Rule } from '@alifd/field';
import { Grid, Form, Input, Field, Button, Message, Card, Loading, Select, Dialog } from '@alifd/next';
import { connect } from 'dva';
import React from 'react';
import { BiCodeBlock, BiLaptop } from 'react-icons/bi';

import { createConfig, detailConfig, detailTemplate, listTemplates, updateConfig } from '../../../../api/config';
import DrawerWithFooter from '../../../../components/Drawer';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import UISchema from '../../../../components/UISchema';
import i18n from '../../../../i18n';
import type { Config, ConfigTemplate, ConfigTemplateDetail, NamespacedName } from '@velaux/data';
import { checkName } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';

type Props = {
  visible: boolean;
  template?: NamespacedName;
  configName?: string;
  // When creating or updating the config belong to a project, this field is required.
  project?: string;
  onSuccess: () => void;
  onClose: () => void;
};

type State = {
  templateDetail?: ConfigTemplateDetail;
  templateLoading: boolean;
  createLoading: boolean;
  propertiesMode: 'native' | 'code';
  templates?: ConfigTemplate[];
};

@connect()
class CreateConfigDialog extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      templateLoading: false,
      createLoading: false,
      propertiesMode: 'native',
    };
    this.field = new Field(this);
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    const { configName, template } = this.props;
    if (configName) {
      this.onDetailConfig(() => {
        if (template) {
          this.onDetailTemplate(template);
        }
      });
    } else {
      if (template) {
        this.onDetailTemplate(template);
      }
    }
    this.loadProjectTemplates();
  }

  loadProjectTemplates = () => {
    const { project } = this.props;
    if (project) {
      listTemplates(project).then((res) => {
        if (res && Array.isArray(res.templates)) {
          this.setState({ templates: res.templates });
        } else {
          this.setState({ templates: [] });
        }
      });
    }
  };

  onDetailConfig = (callback?: () => void) => {
    const { configName, project } = this.props;
    if (configName) {
      detailConfig(configName, project).then((res: Config) => {
        if (res) {
          this.field.setValues({
            name: res.name,
            alias: res.alias,
            description: res.description,
            properties: res.properties,
          });
          if (callback) {
            callback();
          }
        }
      });
    }
  };
  onDetailTemplate = (template: NamespacedName) => {
    this.setState({ templateLoading: true });

    const { project } = this.props;
    detailTemplate(template, project)
      .then((re) => {
        if (re) {
          this.setState({ templateDetail: re });
        }
      })
      .finally(() => {
        this.setState({ templateLoading: false });
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
      const { template } = this.props;
      let templateName = template?.name;
      let namespace = template?.namespace;
      if (values.template) {
        if (values.template.includes('/')) {
          namespace = values.template.split('/')[0];
          templateName = values.template.split('/')[1];
        } else {
          templateName = values.template;
          namespace = '';
        }
      }
      if (!templateName) {
        return;
      }
      const { name, alias, description, properties } = values;
      const params = {
        alias,
        name,
        description,
        template: {
          name: templateName,
          namespace: namespace,
        },
        properties: JSON.stringify(properties),
      };

      this.setState({ createLoading: true });
      createConfig(params, this.props.project)
        .then((res) => {
          if (res) {
            Message.success(<Translation>Config created successfully</Translation>);
            if (templateName && ['image-registry', 'helm-repository', 'tls-certificate'].includes(templateName)) {
              Dialog.confirm({
                content: i18n
                  .t(
                    'This config needs to be distributed, you should go to the project summary page to do it before you want to use it.'
                  )
                  .toString(),
                locale: locale().Dialog,
                onOk: () => {
                  this.props.onSuccess();
                },
                onCancel: () => {
                  this.props.onSuccess();
                },
              });
            } else {
              this.props.onSuccess();
            }
          }
        })
        .finally(() => {
          this.setState({ createLoading: false });
        });
    });
  };

  onUpdate = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { name, alias, description, properties } = values;
      const params = {
        alias,
        description,
        properties: JSON.stringify(properties),
      };

      this.setState({ createLoading: true });
      updateConfig(name, params, this.props.project)
        .then((res) => {
          if (res) {
            Message.success(<Translation>Config updated successfully</Translation>);
            this.props.onSuccess();
          }
        })
        .finally(() => {
          this.setState({ createLoading: false });
        });
    });
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
    const { configName, project, template } = this.props;
    const { createLoading, templateDetail, templateLoading, propertiesMode, templates } = this.state;

    const edit = configName != '' && configName != undefined;
    const buttons = [
      <Button type="secondary" onClick={this.onClose} style={{ marginRight: '16px' }}>
        <Translation>Cancel</Translation>
      </Button>,
    ];
    if (!edit) {
      buttons.push(
        <Permission
          request={{
            resource: project ? `project:${project}/config:${configName}` : `config:${configName}`,
            action: 'create',
          }}
          project={project}
        >
          <Button type="primary" onClick={this.onCreate} loading={createLoading}>
            <Translation>Create</Translation>
          </Button>
        </Permission>
      );
    } else {
      buttons.push(
        <Permission
          request={{
            resource: project ? `project:${project}/config:${configName}` : `config:${configName}`,
            action: 'update',
          }}
          project={project}
        >
          <Button type="primary" onClick={this.onUpdate} loading={createLoading}>
            <Translation>Update</Translation>
          </Button>
        </Permission>
      );
    }
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    const templateOptions = templates?.map((tem) => {
      return {
        label: tem.namespace + '/' + (tem.alias || tem.name),
        value: tem.namespace + '/' + tem.name,
      };
    });
    return (
      <React.Fragment>
        <DrawerWithFooter
          title={edit ? i18n.t('Edit a config') : i18n.t('New a config')}
          placement="right"
          width={800}
          onClose={this.onClose}
          extButtons={buttons}
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Name</Translation>} labelTextAlign="left" required={true} disabled={edit}>
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
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Description</Translation>}>
                  <Input
                    locale={locale().Input}
                    name="description"
                    placeholder={i18n.t('Please enter').toString()}
                    {...init('description')}
                  />
                </FormItem>
              </Col>
            </Row>

            {project && !template && (
              <Row>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <FormItem required label={<Translation>Template</Translation>}>
                    <Select
                      dataSource={templateOptions}
                      locale={locale().Select}
                      name="template"
                      placeholder={i18n.t('Please select a template').toString()}
                      {...init('template', {
                        rules: [
                          {
                            required: true,
                            message: <Translation>Please select a template</Translation>,
                          },
                        ],
                      })}
                      onChange={(value: string) => {
                        let namespace: string | undefined;
                        let name: string = value;
                        if (value.includes('/')) {
                          namespace = value.split('/')[0];
                          name = value.split('/')[1];
                        }
                        this.field.remove('properties');
                        this.setState({ templateDetail: undefined });
                        this.onDetailTemplate({ name: name, namespace: namespace });
                        this.field.setValue('template', value);
                      }}
                    />
                  </FormItem>
                </Col>
              </Row>
            )}
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <Loading visible={templateLoading} style={{ width: '100%' }}>
                  <Card
                    contentHeight={'auto'}
                    style={{ marginTop: '8px' }}
                    title={i18n.t('Properties').toString()}
                    className="withActions"
                    subTitle={
                      <Button
                        style={{ alignItems: 'center', display: 'flex' }}
                        onClick={() => {
                          if (propertiesMode === 'native') {
                            this.setState({ propertiesMode: 'code' });
                          } else {
                            this.setState({ propertiesMode: 'native' });
                          }
                        }}
                      >
                        {propertiesMode === 'native' && (
                          <BiCodeBlock size={14} title={i18n.t('Switch to the coding mode')} />
                        )}
                        {propertiesMode === 'code' && (
                          <BiLaptop size={14} title={i18n.t('Switch to the native mode')} />
                        )}
                      </Button>
                    }
                  >
                    <FormItem required={true}>
                      <If condition={templateDetail && templateDetail.uiSchema}>
                        <UISchema
                          {...init(`properties`, {
                            rules: [
                              {
                                validator: validator,
                                message: i18n.t('Please check the config properties'),
                              },
                            ],
                          })}
                          enableCodeEdit={propertiesMode === 'code'}
                          uiSchema={templateDetail && templateDetail.uiSchema}
                          ref={this.uiSchemaRef}
                          mode={edit ? 'edit' : 'new'}
                        />
                      </If>
                    </FormItem>
                  </Card>
                </Loading>

                <If condition={!templateDetail}>
                  <Message type="notice">
                    <Translation>Can not load the template detail</Translation>
                  </Message>
                </If>
              </Col>
            </Row>
          </Form>
        </DrawerWithFooter>
      </React.Fragment>
    );
  }
}

export default CreateConfigDialog;
