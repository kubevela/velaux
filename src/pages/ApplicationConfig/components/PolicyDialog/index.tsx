import React from 'react';
import { withTranslation } from 'react-i18next';
import type {
  CreatePolicyRequest,
  DefinitionDetail,
  EnvBinding,
  Workflow,
} from '../../../../interface/application';
import DrawerWithFooter from '../../../../components/Drawer';
import i18n from '../../../../i18n';
import Translation from '../../../../components/Translation';
import {
  Card,
  Form,
  Grid,
  Message,
  Button,
  Select,
  Input,
  Field,
  Icon,
  Loading,
} from '@b-design/ui';
import { AiOutlineHdd, AiOutlineMergeCells, AiOutlineOneToOne } from 'react-icons/ai';
import './index.less';
import { If } from 'tsx-control-statements/components';
import classNames from 'classnames';
import Permission from '../../../../components/Permission';
import locale from '../../../../utils/locale';
import { createPolicy, detailPolicyDefinition } from '../../../../api/application';
import type { DefinitionBase } from '../../../../interface/definitions';
import { checkName } from '../../../../utils/common';
import UISchema from '../../../../components/UISchema';
import type { Rule } from '@alifd/meet-react/lib/field';
import { connect } from 'dva';

const { Row, Col } = Grid;

type Props = {
  visible: boolean;
  appName: string;
  project: string;
  workflows: Workflow[];
  envbinding: EnvBinding[];
  onClose: () => void;
  onOK: () => void;
  dispatch?: ({}) => {};
};

type PolicyItem = {
  icon: React.ReactNode;
  label: string;
  name: string;
  title?: string;
  type: string;
  properties?: any;
};

type State = {
  items: PolicyItem[];
  selectedPolicyItem?: PolicyItem;
  policyDefinitionDetail?: DefinitionDetail;
  createPolicyLoading: boolean;
  definitionsLoading: boolean;
  definitionDetailLoading: boolean;
  definitions?: DefinitionBase[];
  propertiesMode: 'native' | 'code';
};

@connect()
class PolicyDialog extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {
      items: [
        {
          label: i18n.t('Override'),
          type: 'override',
          name: 'override-custom',
          icon: <AiOutlineMergeCells size={35} />,
          title: i18n.t(
            'Set differentiated configurations of the application in different environments.',
          ),
        },
        {
          label: i18n.t('Apply Once'),
          type: 'apply-once',
          name: 'apply-once-no-rule',
          icon: <AiOutlineOneToOne size={35} />,
          title: i18n.t(
            'This policy allows direct changes to the resources distributed to the target cluster.',
          ),
          properties: {
            enable: true,
          },
        },
        {
          label: i18n.t('PVC GC Ignore'),
          type: 'garbage-collect',
          name: 'garbage-collect-ignore-pvc',
          icon: <AiOutlineHdd size={35} />,
          title: i18n.t(
            'This policy allows keeping the PVC resource after recycling the application.',
          ),
          properties: {
            rules: [
              {
                selector: {
                  resourceTypes: ['PersistentVolumeClaim'],
                },
                strategy: 'never',
              },
            ],
          },
        },
        {
          label: i18n.t('Replicas Drift'),
          type: 'apply-once',
          name: 'apply-once-ignore-replicas',
          icon: <AiOutlineOneToOne size={35} />,
          title: i18n.t(
            'This policy allows for drift in replicas configuration for workloads, such as working with HPA.',
          ),
          properties: {
            rules: [
              {
                enable: true,
                rules: [
                  {
                    selector: {
                      resourceTypes: ['Deployment', 'StatefulSet', 'Job'],
                    },
                    strategy: {
                      path: ['spec.replicas'],
                    },
                  },
                ],
              },
            ],
          },
        },
        // {
        //   label: i18n.t('Custom'),
        //   name: 'custom',
        //   type: '',
        //   icon: <AiOutlineFileDone size={35} />,
        //   title: i18n.t('Configure other supported policy types.'),
        // },
      ],
      createPolicyLoading: false,
      definitionsLoading: false,
      definitionDetailLoading: false,
      propertiesMode: 'native',
    };
    this.field = new Field(this);
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    this.setUISchemaContext();
  }

  setUISchemaContext = () => {
    const { dispatch, appName, project } = this.props;
    if (dispatch) {
      dispatch({
        type: 'uischema/setAppName',
        payload: appName,
      });
      dispatch({
        type: 'uischema/setProject',
        payload: project,
      });
    }
  };

  extButtonList = () => {
    const { appName, project } = this.props;
    const { createPolicyLoading, selectedPolicyItem } = this.state;
    return (
      <div>
        <Permission
          request={{
            resource: `project:${project}/application:${appName}/policy:*`,
            action: 'create',
          }}
          project={project}
        >
          <Button
            disabled={!selectedPolicyItem}
            type="primary"
            onClick={this.onSubmitCreate}
            loading={createPolicyLoading}
          >
            {i18n.t('Create')}
          </Button>
        </Permission>
      </div>
    );
  };

  onSubmitCreate = () => {
    const { selectedPolicyItem } = this.state;
    if (!selectedPolicyItem) {
      return;
    }
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      this.setState({ createPolicyLoading: true });
      const { appName } = this.props;
      if (!appName) {
        return;
      }
      const { properties, name, alias, description, env, type, workflow, steps } = values;
      let policyType = selectedPolicyItem.type;
      if (!policyType) {
        policyType = type;
      }
      if (!policyType) {
        Message.warning(i18n.t('Please select a policy type first.'));
        return;
      }
      let envName = env;
      if (!envName && workflow) {
        envName = this.getEnvNameFromWorkflow(workflow);
      }
      const params: CreatePolicyRequest = {
        name: name,
        type: selectedPolicyItem.type,
        envName: envName,
        description: description,
        alias: alias,
        properties: JSON.stringify(properties),
      };
      if (workflow && steps && steps.length > 0) {
        params.workflowPolicyBind = [
          {
            name: workflow,
            steps: steps,
          },
        ];
      }
      createPolicy(appName, params)
        .then((res) => {
          if (res) {
            Message.success(i18n.t('Policy added successfully'));
            this.props.onOK();
          }
        })
        .finally(() => {
          this.setState({ createPolicyLoading: false });
        });
    });
  };
  onSelectPolicy = (item: PolicyItem) => {
    this.field.reset();
    this.field.setValues({
      name: item.name,
      description: item.title,
      properties: item.properties,
      type: item.type,
      alias: item.label,
    });
    if (item.name == 'custom') {
      this.loadPolicyDefinitions();
    }
    if (!item.properties) {
      this.loadPolicyDefinitionDetail(item.type);
    }
    this.setState({ selectedPolicyItem: item });
  };

  buildEnvironmentOptions = () => {
    const { envbinding } = this.props;
    return envbinding?.map((env) => {
      return {
        label: env.alias,
        value: env.name,
      };
    });
  };

  buildWorkflowStepsOptions = () => {
    const workflowName = this.field.getValue('workflow');
    const { workflows } = this.props;
    const stepOptions: { label: string; value: string }[] = [];
    workflows.map((wf) => {
      if (wf.name == workflowName) {
        wf.steps?.map((step) => {
          if ((step.type = 'deploy')) {
            stepOptions.push({
              label: `${step.name}(${step.alias || '-'})`,
              value: step.name,
            });
          }
        });
      }
    });
    return stepOptions;
  };

  buildWorkflowOptions = () => {
    const { workflows } = this.props;
    return workflows.map((wf) => {
      return {
        label: `${wf.name}(${wf.alias || '-'})`,
        value: wf.name,
      };
    });
  };

  getEnvNameFromWorkflow = (workflowName: string) => {
    const { workflows } = this.props;
    let envName = '';
    workflows.map((wf) => {
      if (wf.name == workflowName) {
        envName = wf.envName;
      }
    });
    return envName;
  };

  loadPolicyDefinitions = () => {};

  loadPolicyDefinitionDetail = (policyType: string) => {
    this.setState({ definitionDetailLoading: true });
    detailPolicyDefinition({ name: policyType })
      .then((res) => {
        if (res) {
          this.setState({ policyDefinitionDetail: res });
        }
      })
      .finally(() => {
        this.setState({ definitionDetailLoading: false });
      });
  };

  render() {
    const { onClose } = this.props;
    const {
      items,
      selectedPolicyItem,
      definitionDetailLoading,
      policyDefinitionDetail,
      propertiesMode,
    } = this.state;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    const init = this.field.init;
    return (
      <DrawerWithFooter
        title={i18n.t('New Policy')}
        placement="right"
        width={800}
        onClose={onClose}
        extButtons={this.extButtonList()}
      >
        <Form field={this.field}>
          <Card contentHeight="auto" title={i18n.t('Select a policy type')}>
            <Row wrap={true}>
              {items.map((item) => {
                return (
                  <Col l={6} title={item.title} key={item.name}>
                    <div
                      className={classNames('policy-item', {
                        active: selectedPolicyItem && selectedPolicyItem.name == item.name,
                      })}
                      onClick={() => this.onSelectPolicy(item)}
                    >
                      <div className="policy-icon">{item.icon}</div>
                      <div className="policy-name">{item.label}</div>
                    </div>
                  </Col>
                );
              })}
            </Row>
            <If condition={selectedPolicyItem}>
              <Row wrap={true}>
                <Col span={12} style={{ padding: '0 8px' }}>
                  <Form.Item label={i18n.t('Name')} required={true}>
                    <Input
                      {...init(`name`, {
                        rules: [
                          {
                            required: true,
                            pattern: checkName,
                            message: 'Please enter a valid policy name',
                          },
                        ],
                      })}
                      locale={locale().Input}
                    />
                  </Form.Item>
                </Col>
                <Col span={12} style={{ padding: '0 8px' }}>
                  <Form.Item label={i18n.t('Alias')}>
                    <Input
                      {...init(`alias`, {
                        rules: [
                          {
                            minLength: 2,
                            maxLength: 64,
                            message: 'Enter a string of 2 to 64 characters.',
                          },
                        ],
                      })}
                      locale={locale().Input}
                    />
                  </Form.Item>
                </Col>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <Form.Item label={<Translation>Description</Translation>}>
                    <Input
                      name="description"
                      placeholder={i18n.t('Please enter').toString()}
                      {...init('description', {
                        rules: [
                          {
                            maxLength: 256,
                            message: i18n.t(
                              'Enter a description that contains less than 256 characters.',
                            ),
                          },
                        ],
                      })}
                    />
                  </Form.Item>
                </Col>
                <If condition={selectedPolicyItem && selectedPolicyItem?.name == 'custom'}>
                  <Form.Item label="Custom Type">
                    <Select
                      {...init('type', {
                        rules: [],
                      })}
                      hasClear
                      locale={locale().Select}
                      dataSource={this.buildEnvironmentOptions()}
                    />
                  </Form.Item>
                </If>
              </Row>
            </If>
            <If condition={selectedPolicyItem?.properties}>
              <Message style={{ marginTop: '8px' }} type="success">
                <Translation>This policy already have the default properties</Translation>
              </Message>
            </If>
          </Card>
          <Card
            contentHeight="auto"
            style={{ marginTop: '8px' }}
            title={i18n.t('Select an environment')}
          >
            <If condition={!selectedPolicyItem || selectedPolicyItem.type != 'override'}>
              <div>
                <Form.Item
                  help={i18n.t(
                    'If select an environment, this policy is only enabled in the selected environment.',
                  )}
                >
                  <Select
                    {...init('env', {
                      rules: [],
                    })}
                    hasClear
                    locale={locale().Select}
                    dataSource={this.buildEnvironmentOptions()}
                  />
                </Form.Item>
              </div>
            </If>
            <If condition={selectedPolicyItem && selectedPolicyItem.type == 'override'}>
              <div>
                <Row>
                  <Col span={12} style={{ padding: '0 8px' }}>
                    <Form.Item
                      help={i18n.t('Select the workflow to which the policy should be applied.')}
                      required
                      label={i18n.t('Workflow')}
                    >
                      <Select
                        {...init('workflow', {
                          rules: [
                            {
                              required: true,
                            },
                          ],
                        })}
                        hasClear
                        locale={locale().Select}
                        dataSource={this.buildWorkflowOptions()}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12} style={{ padding: '0 8px' }}>
                    <Form.Item
                      help={i18n.t('Select the steps to which the policy should be applied.')}
                      label={i18n.t('Steps')}
                      required={true}
                    >
                      <Select
                        {...init('steps', {
                          rules: [
                            {
                              required: true,
                            },
                          ],
                        })}
                        hasClear
                        locale={locale().Select}
                        mode="multiple"
                        dataSource={this.buildWorkflowStepsOptions()}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </If>
          </Card>
          <If condition={selectedPolicyItem && !selectedPolicyItem?.properties}>
            <Loading visible={definitionDetailLoading} style={{ width: '100%' }}>
              <Card
                contentHeight={'auto'}
                style={{ marginTop: '8px' }}
                title={i18n.t('Policy Properties')}
                className="withActions"
                subTitle={
                  <Button
                    style={{ marginTop: '-12px' }}
                    onClick={() => {
                      if (propertiesMode === 'native') {
                        this.setState({ propertiesMode: 'code' });
                      } else {
                        this.setState({ propertiesMode: 'native' });
                      }
                    }}
                  >
                    <If condition={propertiesMode === 'native'}>
                      <Icon
                        style={{ color: '#1b58f4' }}
                        type={'display-code'}
                        title={'Switch to the coding mode'}
                      />
                    </If>
                    <If condition={propertiesMode === 'code'}>
                      <Icon
                        style={{ color: '#1b58f4' }}
                        type={'laptop'}
                        title={'Switch to the native mode'}
                      />
                    </If>
                  </Button>
                }
              >
                <Form.Item required={true}>
                  <UISchema
                    key={policyDefinitionDetail?.name}
                    {...init(`properties`, {
                      rules: [
                        {
                          validator: validator,
                          message: i18n.t('Please check the properties of this policy'),
                        },
                      ],
                    })}
                    enableCodeEdit={propertiesMode === 'code'}
                    uiSchema={policyDefinitionDetail && policyDefinitionDetail.uiSchema}
                    definition={{
                      type: 'policy',
                      name: policyDefinitionDetail?.name || '',
                      description: policyDefinitionDetail?.description || '',
                    }}
                    ref={this.uiSchemaRef}
                    mode={'new'}
                  />
                </Form.Item>
                <If condition={!policyDefinitionDetail}>
                  <Message type="notice">
                    <Translation>Please select policy type first.</Translation>
                  </Message>
                </If>
              </Card>
            </Loading>
          </If>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default withTranslation()(PolicyDialog);
