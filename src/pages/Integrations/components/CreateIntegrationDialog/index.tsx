import React from 'react';
import { Link } from 'dva/router';
import { Grid, Form, Input, Field, Button, Select, Message } from '@b-design/ui';
import DrawerWithFooter from '../../../../components/Drawer';
import { If } from 'tsx-control-statements/components';
import EnvDialog from '../../../EnvPage/components/EnvDialog';
import UISchema from '../../../../components/UISchema';
import { detailComponentDefinition } from '../../../../api/application';
import { getEnvs } from '../../../../api/env';
import { createConfigType } from '../../../../api/integration';
import type { Rule } from '@alifd/field';
import type { ComponentDefinitionsBase } from '../../../../interface/application';
import type { Env } from '../../../../interface/env';
import type { Project } from '../../../../interface/project';
import type { DefinitionDetail } from '../../../../interface/application';
import { checkName } from '../../../../utils/common';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import { transComponentDefinitions } from '../../../../utils/utils';
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
  envs?: Env[];
  project?: string;
  loading: boolean;
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
  createLoading: boolean;
  visibleEnvDialog: boolean;
};

type Callback = (envName: string) => void;

class CreateIntegration extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
      definitionLoading: true,
      createLoading: false,
      visibleEnvDialog: false,
      envs: [],
    };
    this.field = new Field(this, {
      onChange: (name: string, value: string) => {
        if (name === 'project') {
          this.setState({ project: value }, () => {
            this.loadEnvs();
          });
        }
      },
    });
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
    detailComponentDefinition({ name: value }).then((re) => {
      if (re) {
        this.setState({ definitionDetail: re });
        if (callback) {
          callback();
        }
      }
    });
  };

  loadEnvs = (callback?: Callback) => {
    const { project } = this.state;
    if (project) {
      getEnvs({ project, page: 0 }).then((res) => {
        if (res) {
          this.setState({ envs: res && res.envs });
          const envOption = (res?.envs || []).map((env: { name: string; alias: string }) => {
            return {
              label: env.alias ? `${env.alias}(${env.name})` : env.name,
              value: env.name,
            };
          });
          if (callback) {
            callback(envOption[0]?.value || '');
          }
        }
      });
    }
  };

  onClose = () => {
    this.props.onClose();
  };

  onCreate = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { configType } = this.props;
      const { name, alias, project, envBindings, description, componentType, properties } = values;
      const envBinding = envBindings.map((env: string) => {
        return { name: env };
      });
      const params = {
        alias,
        name,
        description,
        project: project,
        envBinding: envBinding,
        componentType,
        properties: JSON.stringify(properties),
      };
      this.setState({ createLoading: true });
      const queryData = { configType };
      createConfigType(queryData, params)
        .then((res) => {
          if (res) {
            Message.success(<Translation>Create config success</Translation>);
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

  setEnvValue = (envBinding: string) => {
    const envBindings: string[] = this.field.getValue('envBindings');
    (envBindings || []).push(envBinding);
    this.field.setValues({ envBindings });
  };

  onCloseEnvDialog = () => {
    this.setState({
      visibleEnvDialog: false,
    });
  };
  onOKEnvDialog = () => {
    this.setState(
      {
        visibleEnvDialog: false,
      },
      () => {
        this.loadEnvs(this.setEnvValue);
      },
    );
  };

  changeEnvDialog = (visible: boolean) => {
    this.setState({
      visibleEnvDialog: visible,
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
    const { projects } = this.props;
    const { createLoading, definitionDetail, envs, visibleEnvDialog } = this.state;
    const buttons = [
      <Button type="secondary" onClick={this.onClose} style={{ marginRight: '16px' }}>
        <Translation>Cancel</Translation>
      </Button>,
      <Button type="primary" onClick={this.onCreate} loading={createLoading}>
        <Translation>Create</Translation>
      </Button>,
    ];

    const projectOptions = projects.map((project) => {
      return {
        label: project.alias ? project.alias : project.name,
        value: project.name,
      };
    });

    const envOptions = envs?.map((env) => {
      return {
        label: env.alias ? `${env.alias}(${env.name})` : env.name,
        value: env.name,
      };
    });

    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    const { componentDefinitions } = this.props;

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
                <FormItem label={<Translation>Project</Translation>} required>
                  <Select
                    name="project"
                    hasClear
                    showSearch
                    placeholder={i18n.t('Please select').toString()}
                    filterLocal={true}
                    dataSource={projectOptions}
                    style={{ width: '100%' }}
                    {...init('project', {
                      rules: [
                        {
                          required: true,
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
            <Row>
              <Col span={24}>
                <FormItem
                  label={
                    <Translation className="font-size-14 font-weight-bold color333">
                      Type
                    </Translation>
                  }
                  required={true}
                  help={
                    <span>
                      <Translation>Get more component type?</Translation>
                      <Link to="/addons">
                        <Translation>Go to enable addon</Translation>
                      </Link>
                    </span>
                  }
                >
                  <Select
                    locale={locale.Select}
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
                    dataSource={transComponentDefinitions(componentDefinitions)}
                    onChange={(item: string) => {
                      this.onDetailsComponentDefinition(item, () => {
                        this.field.setValue('componentType', item);
                      });
                    }}
                  />
                </FormItem>
              </Col>
            </Row>

            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem
                  label={
                    <Translation className="font-size-14 font-weight-bold">
                      Bind Environments
                    </Translation>
                  }
                  help={
                    <a
                      onClick={() => {
                        this.changeEnvDialog(true);
                      }}
                    >
                      <Translation>Create new environment</Translation>
                    </a>
                  }
                  required={true}
                >
                  <Select
                    {...init(`envBindings`, {
                      rules: [
                        {
                          required: true,
                          message: i18n.t('Please select').toString(),
                        },
                      ],
                    })}
                    locale={locale.Select}
                    mode="multiple"
                    dataSource={envOptions}
                    placeholder={i18n.t('Please select').toString()}
                  />
                </FormItem>
              </Col>
            </Row>

            <Row>
              <Col span="24">
                <FormItem required={true}>
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
                </FormItem>
              </Col>
            </Row>
          </Form>

          <If condition={visibleEnvDialog}>
            <EnvDialog
              visible={visibleEnvDialog}
              projects={projects || []}
              isEdit={false}
              onClose={this.onCloseEnvDialog}
              onOK={this.onOKEnvDialog}
            />
          </If>
        </DrawerWithFooter>
      </React.Fragment>
    );
  }
}

export default CreateIntegration;
