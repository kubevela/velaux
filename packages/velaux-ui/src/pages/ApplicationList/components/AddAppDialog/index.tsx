import type { Rule } from '@alifd/field';
import { Grid, Field, Form, Select, Message, Button } from '@alifd/next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import { createApplication } from '../../../../api/application';
import { detailComponentDefinition } from '../../../../api/definitions';
import { getEnvs } from '../../../../api/env';
import DrawerWithFooter from '../../../../components/Drawer';
import { Translation } from '../../../../components/Translation';
import UISchema from '../../../../components/UISchema';
import type { DefinitionDetail , Env , Target , LoginUserInfo, UserProject } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import EnvDialog from '../../../EnvPage/components/EnvDialog';
import GeneralConfig from '../GeneralConfig';

type Props = {
  visible: boolean;
  isDisableProject?: boolean;
  projectName?: string;
  targets?: Target[];
  componentDefinitions: [];
  projects?: UserProject[];
  userInfo?: LoginUserInfo;
  setVisible: (visible: boolean) => void;
  dispatch: ({}) => void;
  onClose: () => void;
  onOK: (name: string) => void;
};

type State = {
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
  dialogStats: string;
  envs?: Env[];
  project?: string;
  visibleEnvDialog: boolean;
  createLoading: boolean;
};

type Callback = (envName: string) => void;
type SelectGroupType = Array<{
  label: string;
  children: Array<{ label: string; value: string }>;
}>;

@connect(() => {
  return {};
})
class AppDialog extends React.Component<Props, State> {
  field: Field;
  basicRef: React.RefObject<GeneralConfig>;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {
      definitionLoading: true,
      dialogStats: 'isBasic',
      envs: [],
      visibleEnvDialog: false,
      createLoading: false,
    };
    this.field = new Field(this, {
      autoUnmount: false,
      onChange: (name: string, value: string) => {
        if (name === 'project') {
          this.setState({ project: value }, () => {
            this.loadEnvs();
            this.field.setValue('envBindings', []);
          });
        }
      },
    });
    this.uiSchemaRef = React.createRef();
    this.basicRef = React.createRef();
  }

  componentDidMount() {
    const { projects, projectName } = this.props;
    if (projectName) {
      this.field.setValue('project', projectName);
    }
    let defaultProject = '';
    (projects || []).map((item, i: number) => {
      if (i == 0) {
        defaultProject = item.name;
      }
      if (item.name == 'default') {
        defaultProject = item.name;
      }
      return;
    });
    if (projectName || defaultProject) {
      this.setState({ project: projectName ? projectName : defaultProject }, () => {
        this.loadEnvs();
      });
    }
    this.onDetailComponentDefinition('webservice');
  }

  onClose = () => {
    this.props.setVisible(false);
  };

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { description, alias, name, icon = '', componentType, properties, envBindings, project } = values;
      const envbinding = envBindings?.map((env: string) => {
        return { name: env };
      });
      const params = {
        alias,
        icon,
        name,
        description,
        project: project || 'default',
        envBinding: envbinding,
        component: {
          alias,
          componentType,
          description,
          icon,
          name,
          properties: JSON.stringify(properties),
        },
      };
      this.setState({ createLoading: true });
      createApplication(params).then((res) => {
        if (res && res.name) {
          Message.success(<Translation>Application created successfully</Translation>);
          this.props.onOK(name);
        }
        this.setState({ createLoading: false });
      });
    });
  };

  loadEnvs = (callback?: Callback) => {
    if (this.state.project) {
      //Temporary logic
      getEnvs({ project: this.state.project, page: 0 }).then((res) => {
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

  transComponentDefinitions() {
    const { componentDefinitions } = this.props;
    const defaultCoreDataSource = ['k8s-objects', 'task', 'webservice', 'worker'];
    const cloud: SelectGroupType = [
      {
        label: 'Cloud',
        children: [],
      },
    ];
    const core: SelectGroupType = [
      {
        label: 'Core',
        children: [],
      },
    ];
    const custom: SelectGroupType = [
      {
        label: 'Custom',
        children: [],
      },
    ];
    (componentDefinitions || []).map((item: { name: string; workloadType: string }) => {
      if (item.workloadType === 'configurations.terraform.core.oam.dev') {
        cloud[0].children.push({
          label: item.name,
          value: item.name,
        });
      } else if (defaultCoreDataSource.includes(item.name)) {
        core[0].children.push({
          label: item.name,
          value: item.name,
        });
      } else {
        custom[0].children.push({
          label: item.name,
          value: item.name,
        });
      }
    });
    return [...core, ...custom, ...cloud];
  }

  onDetailComponentDefinition = (value: string) => {
    detailComponentDefinition({ name: value }).then((re) => {
      if (re) {
        this.setState({ definitionDetail: re, definitionLoading: false });
      }
    });
  };

  changeStatus = (value: string) => {
    const values: { componentType: string; envBindings: string[]; project: string } = this.field.getValues();
    const { envBindings } = values;
    if (value === 'isCreateComponent') {
      this.field.validateCallback(
        ['name', 'alias', 'description', 'project', 'componentType', 'envBindings'],
        (error: any) => {
          if (error) {
            return;
          }
          const { dispatch } = this.props;
          if (Array.isArray(envBindings) && envBindings.length > 0) {
            const { envs } = this.state;
            let namespace = '';
            envs?.map((env: Env) => {
              if (envBindings[0] == env.name) {
                namespace = env.namespace;
              }
            });
            dispatch({
              type: 'uischema/setAppNamespace',
              payload: namespace,
            });
            dispatch({
              type: 'uischema/setProject',
              payload: values.project,
            });
          }
          this.setState({
            dialogStats: value,
          });
        }
      );
    } else if (value === 'isBasic') {
      this.setState({
        dialogStats: value,
      });
    }
  };

  extButtonList = () => {
    const { dialogStats, createLoading } = this.state;
    const { onClose } = this.props;
    if (dialogStats === 'isBasic') {
      return (
        <div>
          <Button type="secondary" onClick={onClose} className="margin-right-10">
            <Translation>Cancel</Translation>
          </Button>
          <Button
            type="primary"
            onClick={() => {
              this.changeStatus('isCreateComponent');
            }}
          >
            <Translation>Next Step</Translation>
          </Button>
        </div>
      );
    } else if (dialogStats === 'isCreateComponent') {
      return (
        <div>
          <Button
            type="secondary"
            onClick={() => {
              this.changeStatus('isBasic');
            }}
            className="margin-right-10"
          >
            <Translation>Previous</Translation>
          </Button>
          <Button loading={createLoading} type="primary" onClick={this.onSubmit}>
            <Translation>Create</Translation>
          </Button>
        </div>
      );
    } else {
      return <div />;
    }
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
      }
    );
  };
  changeEnvDialog = (visible: boolean) => {
    this.setState({
      visibleEnvDialog: visible,
    });
  };
  setEnvValue = (envBinding: string) => {
    const envBindings: string[] = this.field.getValue('envBindings');
    (envBindings || []).push(envBinding);
    this.field.setValues({ envBindings });
  };

  removeProperties = () => {
    this.field.remove('properties');
    this.setState({ definitionDetail: undefined });
  };

  handleChange = (value: string) => {
    this.removeProperties();
    this.field.setValues({ componentType: value });
    this.onDetailComponentDefinition(value);
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const { visible, setVisible, dispatch, projects, onClose, isDisableProject, userInfo } = this.props;
    const { definitionDetail, dialogStats, envs, visibleEnvDialog } = this.state;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    const envOptions = envs?.map((env) => {
      return {
        label: env.alias ? `${env.alias}(${env.name})` : env.name,
        value: env.name,
      };
    });
    const secondStep =
      dialogStats === 'isCreateComponent' && definitionDetail && definitionDetail.uiSchema ? true : false;
    init('test');
    return (
      <React.Fragment>
        <DrawerWithFooter
          title={<Translation>New Application</Translation>}
          placement="right"
          width={800}
          visible={visible}
          onClose={onClose}
          extButtons={this.extButtonList()}
        >
          <Form field={this.field}>
            {dialogStats === 'isBasic' && (
              <>
                <GeneralConfig
                  visible={visible}
                  setVisible={setVisible}
                  dispatch={dispatch}
                  userInfo={userInfo}
                  projects={projects}
                  isDisableProject={isDisableProject}
                  field={this.field}
                  ref={this.basicRef}
                />

                <Row>
                  <Col span={24} style={{ padding: '0 8px' }}>
                    <FormItem
                      label={<Translation className="font-size-14 font-weight-bold">Main Component Type</Translation>}
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
                        locale={locale().Select}
                        showSearch
                        className="select"
                        {...init(`componentType`, {
                          initValue: 'webservice',
                          rules: [
                            {
                              required: true,
                              message: 'Please select',
                            },
                          ],
                        })}
                        dataSource={this.transComponentDefinitions()}
                        onChange={this.handleChange}
                      />
                    </FormItem>
                  </Col>
                </Row>
                <Row>
                  <Col span={24} style={{ padding: '0 8px' }}>
                    <FormItem
                      label={<Translation className="font-size-14 font-weight-bold">Bind Environments</Translation>}
                      help={
                        <a
                          onClick={() => {
                            this.changeEnvDialog(true);
                          }}
                        >
                          <Translation>New Environment</Translation>
                        </a>
                      }
                      required={true}
                    >
                      <Select
                        {...init(`envBindings`, {
                          rules: [
                            {
                              required: true,
                              message: 'Please select env',
                            },
                          ],
                        })}
                        locale={locale().Select}
                        mode="multiple"
                        dataSource={envOptions}
                      />
                    </FormItem>
                  </Col>
                </Row>
              </>
            )}

            {secondStep && (
              <FormItem required={true}>
                <UISchema
                  {...init(`properties`, {
                    rules: [
                      {
                        validator: validator,
                        message: 'Please check app deploy properties',
                      },
                    ],
                  })}
                  uiSchema={definitionDetail && definitionDetail.uiSchema}
                  ref={this.uiSchemaRef}
                  mode="new"
                />
              </FormItem>
            )}
          </Form>
        </DrawerWithFooter>
        {visibleEnvDialog && (
          <EnvDialog
            visible={visibleEnvDialog}
            userInfo={userInfo}
            projects={projects || []}
            project={this.field.getValue('project')}
            isEdit={false}
            onClose={this.onCloseEnvDialog}
            onOK={this.onOKEnvDialog}
          />
        )}
      </React.Fragment>
    );
  }
}

export default AppDialog;
