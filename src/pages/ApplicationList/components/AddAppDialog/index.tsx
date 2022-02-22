import React from 'react';
import { Grid, Field, Form, Select, Message, Button } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { Link } from 'dva/router';
import { If } from 'tsx-control-statements/components';
import GeneralConfig from '../GeneralConfig';
import type { Rule } from '@alifd/field';
import { detailComponentDefinition, createApplication } from '../../../../api/application';
import type { DefinitionDetail } from '../../../../interface/application';
import UISchema from '../../../../components/UISchema';
import DrawerWithFooter from '../../../../components/Drawer';
import Translation from '../../../../components/Translation';
import './index.less';
import type { Project } from '../../../../interface/project';
import type { Cluster } from '../../../../interface/cluster';
import { connect } from 'dva';
import locale from '../../../../utils/locale';
import { getEnvs } from '../../../../api/env';
import type { Env } from '../../../../interface/env';
import type { Target } from '../../../../interface/target';
import EnvDialog from '../../../EnvPage/components/EnvDialog';

type Props = {
  visible: boolean;
  targets?: Target[];
  componentDefinitions: [];
  projects?: Project[];
  syncProjectList: () => void;
  clusterList?: Cluster[];
  setVisible: (visible: boolean) => void;
  dispatch: ({}) => void;
  onClose: () => void;
  onOK: (name: string) => void;
  t: (key: string) => string;
};

type State = {
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
  dialogStats: string;
  envs?: Env[];
  project?: string;
  visibleEnvDialog: boolean;
};

type Callback = (envName: string) => void;
type SelectGroupType = {
  label: string;
  children: { label: string; value: string }[];
}[];

@connect((store: any) => {
  return { ...store.clusters };
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
    this.basicRef = React.createRef();
  }

  componentDidMount() {
    const { projects } = this.props;
    if (projects && projects.length > 0) {
      this.field.setValue('project', projects[0].name);
      this.setState({ project: projects[0].name }, () => {
        this.loadEnvs();
      });
    }
    this.getClusterList();
  }

  onClose = () => {
    this.props.setVisible(false);
  };

  getClusterList = async () => {
    this.props.dispatch({
      type: 'clusters/getClusterList',
    });
  };

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const {
        description,
        alias,
        name,
        icon = '',
        componentType,
        properties,
        envBindings,
      } = values;
      const envbinding = envBindings.map((env: string) => {
        return { name: env };
      });
      const params = {
        alias,
        icon,
        name,
        description,
        project: 'default',
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
      createApplication(params).then((res) => {
        if (res) {
          Message.success(<Translation>create application success</Translation>);
          this.props.onOK(name);
        }
      });
    });
  };

  loadEnvs = (callback?: Callback) => {
    if (this.state.project) {
      //Temporary logic
      getEnvs({ project: 'default', page: 0 }).then((res) => {
        if (res) {
          this.setState({ envs: res.envs });
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

  onDetailsComponeDefinition = (value: string) => {
    detailComponentDefinition({ name: value }).then((re) => {
      if (re) {
        this.setState({ definitionDetail: re, definitionLoading: false });
      }
    });
  };

  changeStatus = (value: string) => {
    const values: { componentType: string; envBindings: string[] } = this.field.getValues();
    const { componentType, envBindings } = values;
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
          }
          this.setState(
            {
              dialogStats: value,
            },
            () => {
              this.onDetailsComponeDefinition(componentType);
            },
          );
        },
      );
    } else if (value === 'isBasic') {
      this.setState({
        dialogStats: value,
      });
    }
  };

  extButtonList = () => {
    const { dialogStats } = this.state;
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
          <Button type="primary" onClick={this.onSubmit}>
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
      },
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

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;

    const { visible, setVisible, dispatch, projects, targets, syncProjectList, t, onClose } =
      this.props;

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
    return (
      <React.Fragment>
        <DrawerWithFooter
          title={<Translation>New Application</Translation>}
          placement="right"
          width={800}
          onClose={onClose}
          extButtons={this.extButtonList()}
        >
          <Form field={this.field}>
            <If condition={dialogStats === 'isBasic'}>
              <GeneralConfig
                visible={visible}
                setVisible={setVisible}
                dispatch={dispatch}
                projects={projects}
                syncProjectList={syncProjectList}
                field={this.field}
                ref={this.basicRef}
              />

              <Row>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <FormItem
                    label={
                      <Translation className="font-size-14 font-weight-bold">Type</Translation>
                    }
                    required={true}
                    help={
                      <span>
                        Get more component type? <Link to="/addons">Go to enable addon</Link>
                      </span>
                    }
                  >
                    <Select
                      locale={locale.Select}
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
                            message: 'Please select env',
                          },
                        ],
                      })}
                      locale={locale.Select}
                      mode="multiple"
                      dataSource={envOptions}
                    />
                  </FormItem>
                </Col>
              </Row>
            </If>

            <If condition={dialogStats === 'isCreateComponent'}>
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
            </If>
          </Form>
        </DrawerWithFooter>
        <If condition={visibleEnvDialog}>
          <EnvDialog
            t={t}
            visible={visibleEnvDialog}
            targets={targets || []}
            projects={projects || []}
            syncProjectList={this.props.syncProjectList}
            isEdit={false}
            onClose={this.onCloseEnvDialog}
            onOK={this.onOKEnvDialog}
          />
        </If>
      </React.Fragment>
    );
  }
}

export default withTranslation()(AppDialog);
