import type { Rule } from '@alifd/field';
import { Grid, Field, Form, Select, Message, Button, Input } from '@alifd/next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import { createApplication, getDraftExpressionEnv } from '../../../../api/application';
import { detailComponentDefinition, getComponentDefinitions } from '../../../../api/definitions';
import { getEnvs } from '../../../../api/env';
import DrawerWithFooter from '../../../../components/Drawer';
import { Translation } from '../../../../components/Translation';
import UISchema from '../../../../components/UISchema';
import type { ExpressionContext } from '../../../../components/UISchema';
import type { ExpressionEnv } from '../../../../extends/ExpressionEditor';
import { checkName } from '../../../../utils/common';
import type { DefinitionDetail, DefinitionBase, Env, Target, LoginUserInfo, UserProject } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import { deployNamespaces, isUsable } from '../../../../utils/restrictions';
import type { DeployTarget } from '../../../../utils/restrictions';
import { transComponentDefinitions } from '../../../../utils/utils';
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
  // Component types as the selected environments' namespaces may use them.
  componentDefinitions?: DefinitionBase[];
  // expressionEnv and optIn are the new application's $( ) expressions: what
  // they can read, and whether it will read them.
  expressionEnv?: ExpressionEnv;
  optIn: boolean;
};

type Callback = (envName: string) => void;

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
      // The fx toggles show from the start; the application is opted in on
      // create only if a value uses an expression.
      optIn: true,
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
        if (name === 'envBindings') {
          this.loadComponentDefinitions();
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
      const { alias, description, icon = '', componentType, properties, name, componentName } = values;
      const serialized = JSON.stringify(properties);
      this.create(values, {
        alias,
        componentType,
        description,
        icon,
        name: componentName || name,
        properties: serialized,
      });
    });
  };

  // onSkip creates the application without a main component and opens it, so
  // its components can be added from the application's own page.
  onSkip = () => {
    this.field.validate(['name', 'alias', 'description', 'project', 'envBindings'], (error: any, values: any) => {
      if (error) {
        return;
      }
      this.create(values);
    });
  };

  create = (values: any, component?: Record<string, any>) => {
    const { description, alias, name, icon = '', envBindings, project } = values;
    const envbinding = envBindings?.map((env: string) => {
      return { name: env };
    });
    // Reading expressions is opted into only where a value uses one.
    const usesExpressions = this.state.optIn && !!component && component.properties?.includes('$(');
    const params = {
      alias,
      icon,
      name,
      description,
      project: project || 'default',
      envBinding: envbinding,
      annotations: usesExpressions ? { 'app.oam.dev/cel-expressions': 'true' } : undefined,
      component,
    };
    this.setState({ createLoading: true });
    createApplication(params).then((res) => {
      if (res && res.name) {
        Message.success(<Translation>Application created successfully</Translation>);
        this.props.onOK(name);
      }
      this.setState({ createLoading: false });
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

  // selectedTargets are the environments chosen to bind, where the application's
  // component types' restrictions are checked.
  selectedTargets(): DeployTarget[] {
    const selected: string[] = this.field.getValue('envBindings') || [];
    return (this.state.envs || [])
      .filter((env) => selected.includes(env.name))
      .map((env) => ({ name: env.name, alias: env.alias, appDeployNamespace: env.namespace }));
  }

  // definitionsRequest numbers the component definition requests, so only the
  // latest may set the list: an earlier one asked about other environments.
  definitionsRequest = 0;

  loadComponentDefinitions = () => {
    const namespaces = deployNamespaces(this.selectedTargets());
    const request = ++this.definitionsRequest;
    if (namespaces.length === 0) {
      this.setState({ componentDefinitions: undefined });
      return;
    }
    getComponentDefinitions(namespaces).then((res) => {
      if (res && request === this.definitionsRequest) {
        this.setState({ componentDefinitions: res.definitions });
        // A type chosen before the environments, such as the default, may be
        // one they cannot use; move to the first they can rather than submit a
        // refusal.
        const chosen = this.field.getValue<string>('componentType');
        const usable = (res.definitions || []).filter(isUsable).map((d: DefinitionBase) => d.name);
        if (!chosen || !usable.includes(chosen)) {
          if (usable.length > 0) {
            this.handleChange(usable[0]);
          } else {
            this.field.setValue('componentType', undefined);
            this.setState({ definitionDetail: undefined });
          }
        }
      }
    });
  };

  onDetailComponentDefinition = (value: string) => {
    detailComponentDefinition({ name: value }).then((re) => {
      if (re) {
        this.setState({ definitionDetail: re, definitionLoading: false });
      }
    });
  };

  loadExpressionEnv = async (optIn: boolean) => {
    try {
      const env: ExpressionEnv = await getDraftExpressionEnv('component', optIn);
      this.setState({ expressionEnv: env });
    } catch (e) {
      this.setState({ expressionEnv: undefined });
    }
  };

  // expressionContext lets the main component's properties take $( )
  // expressions before the application exists; the switch is kept here and
  // set on the application as it is created.
  expressionContext = (): ExpressionContext => ({
    appName: this.field.getValue<string>('name') || '',
    surface: 'component',
    env: this.state.expressionEnv,
    draft: true,
    onOptIn: async (on: boolean) => {
      this.setState({ optIn: on });
      await this.loadExpressionEnv(on);
      return true;
    },
  });

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
          // The main component is named after the application until renamed.
          if (!this.field.getValue('componentName')) {
            this.field.setValue('componentName', this.field.getValue('name'));
          }
          this.loadExpressionEnv(this.state.optIn);
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
          <Button type="secondary" onClick={this.onSkip} loading={createLoading} className="margin-right-10">
            <Translation>Skip</Translation>
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
          <Button type="secondary" onClick={this.onSkip} loading={createLoading} className="margin-right-10">
            <Translation>Skip</Translation>
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
    this.loadComponentDefinitions();
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
                        dataSource={transComponentDefinitions(
                          this.state.componentDefinitions || this.props.componentDefinitions
                        )}
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
              <Row>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <FormItem
                    label={<Translation className="font-size-14 font-weight-bold">Main Component Name</Translation>}
                    required={true}
                  >
                    <Input
                      {...init('componentName', {
                        rules: [{ required: true, pattern: checkName, message: 'Please input a valid component name' }],
                      })}
                      locale={locale().Input}
                    />
                  </FormItem>
                </Col>
              </Row>
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
                  expressions={this.expressionContext()}
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
