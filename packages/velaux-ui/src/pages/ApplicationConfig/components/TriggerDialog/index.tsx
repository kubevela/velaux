import { Grid, Field, Form, Select, Message, Button, Input } from '@alifd/next';
import React from 'react';
import type { Dispatch } from 'redux';

import { createTrigger, updateTrigger } from '../../../../api/application';
import { detailComponentDefinition } from '../../../../api/definitions';
import { getPayloadType } from '../../../../api/payload';
import DrawerWithFooter from '../../../../components/Drawer';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type {
  Workflow,
  Trigger,
  UIParam,
  ApplicationComponentBase,
  CreateTriggerRequest,
  UpdateTriggerRequest,
} from '@velaux/data';
import { checkName } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';

type Props = {
  visible: boolean;
  appName?: string;
  workflows?: Workflow[];
  onOK: (params: Trigger) => void;
  onClose: () => void;
  dispatch?: Dispatch<any>;
  components: ApplicationComponentBase[];
  trigger?: Trigger;
};

type State = {
  loading: boolean;
  payloadTypes: string[];
  hasImage: boolean;
  component?: ApplicationComponentBase;
  submitLoading?: boolean;
};

class TriggerDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      payloadTypes: ['custom', 'dockerHub', 'ACR', 'harbor', 'artifactory'],
      hasImage: false,
    };
    this.field = new Field(this);
  }

  componentDidMount() {
    const { trigger } = this.props;
    if (trigger) {
      this.field.setValues(trigger);
    }
    const type = this.field.getValue('type');
    if (type === 'webhook') {
      this.onGetPayloadType();
    }
    const { components } = this.props;
    if (components && components.length > 0) {
      this.changeComponentName(components[0].name);
    }
  }

  onGetPayloadType() {
    getPayloadType().then((res: string[]) => {
      if (res) {
        this.setState({
          payloadTypes: res,
        });
      }
    });
  }

  onDetailComponentDefinition = (value: string) => {
    this.setState({ loading: true });
    detailComponentDefinition({ name: value })
      .then((res) => {
        if (res) {
          const findImageObj = (res.uiSchema || []).find((item: UIParam) => item.jsonKey === 'image');
          const hasImage = findImageObj ? true : false;
          this.setState({
            hasImage,
            loading: false,
          });
        }
      })
      .catch(() => this.setState({ loading: false }));
  };

  onClose = () => {
    this.props.onClose();
  };

  onSubmit = () => {
    const { trigger } = this.props;
    const editMode = trigger != undefined;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { appName = '' } = this.props;
      const {
        name = '',
        alias = '',
        description = '',
        type = '',
        payloadType = '',
        workflowName = '',
        componentName = '',
        registry = '',
      } = values;
      const query = { appName };
      this.setState({ submitLoading: true });
      if (editMode) {
        const params: UpdateTriggerRequest = {
          alias,
          description,
          payloadType,
          workflowName,
          componentName,
          registry,
        };
        updateTrigger(params, { appName, token: trigger.token })
          .then((res: any) => {
            if (res) {
              Message.success({
                duration: 4000,
                content: 'Trigger updated successfully.',
              });
              this.props.onOK(res);
            }
          })
          .finally(() => {
            this.setState({ submitLoading: false });
          });
      } else {
        const params: CreateTriggerRequest = {
          name,
          alias,
          description,
          type,
          payloadType,
          workflowName,
          componentName,
          registry,
        };
        createTrigger(params, query)
          .then((res: any) => {
            if (res) {
              Message.success({
                duration: 4000,
                content: 'Trigger created successfully.',
              });
              this.props.onOK(res);
            }
          })
          .finally(() => {
            this.setState({ submitLoading: false });
          });
      }
    });
  };

  extButtonList = () => {
    const { onClose, trigger } = this.props;
    const { submitLoading } = this.state;
    const editMode = trigger != undefined;
    return (
      <div>
        <Button type="secondary" onClick={onClose} className="margin-right-10">
          <Translation>Cancel</Translation>
        </Button>
        <Button loading={submitLoading} type="primary" onClick={this.onSubmit}>
          <Translation>{editMode ? 'Update' : 'Create'}</Translation>
        </Button>
      </div>
    );
  };

  changeType = (value: string) => {
    this.field.setValue('type', value);
    if (value === 'webhook') {
      this.onGetPayloadType();
    }
  };

  isShowMessage() {
    const { hasImage, component } = this.state;
    const type = this.field.getValue('type');
    const payloadType = this.field.getValue('payloadType');
    const components = ['webservice', 'worker', 'task'];
    const isNotInclude = component?.componentType && !components.includes(component?.componentType);
    if (isNotInclude && payloadType !== 'custom' && !hasImage && type === 'webhook') {
      return true;
    } else {
      return false;
    }
  }

  changeComponentName = (value: string) => {
    this.field.setValue('componentName', value);
    let componentType = '';
    const { components } = this.props;
    components.map((c) => {
      if (c.name === value) {
        componentType = c.componentType;
        this.setState({ component: c });
      }
    });
    this.onDetailComponentDefinition(componentType);
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const { workflows, onClose, components, trigger } = this.props;
    const editMode = trigger != undefined;
    const { payloadTypes } = this.state;
    const workflowOption = workflows?.map((workflow) => {
      return {
        label: workflow.alias ? `${workflow.alias}(${workflow.envName})` : workflow.name,
        value: workflow.name,
      };
    });

    const payloadTypeOption = payloadTypes?.map((type) => {
      return {
        label: type,
        value: type,
      };
    });

    const componentsOption = components?.map((component) => {
      return {
        label: component.alias ? `${component.alias}(${component.name})` : component.name,
        value: component.name,
      };
    });

    return (
      <DrawerWithFooter
        title={editMode ? i18n.t('Edit Trigger') : i18n.t('Add Trigger')}
        placement="right"
        width={800}
        onClose={onClose}
        extButtons={this.extButtonList()}
      >
        <Form field={this.field}>
          <Row>
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Name</Translation>} required>
                <Input
                  name="name"
                  disabled={editMode}
                  placeholder={i18n.t('Please enter the name').toString()}
                  {...init('name', {
                    rules: [
                      {
                        required: true,
                        pattern: checkName,
                        message: 'Please enter a valid name contains only alphabetical words',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>
          <Row>
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

            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Description</Translation>}>
                <Input
                  name="description"
                  placeholder={i18n.t('Please enter').toString()}
                  {...init('description', {
                    rules: [
                      {
                        maxLength: 256,
                        message: 'Enter a description that contains less than 256 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>

          <Row wrap>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Type</Translation>} required>
                <Select
                  name="type"
                  locale={locale().Select}
                  disabled={editMode}
                  dataSource={[{ label: 'On Webhook Event', value: 'webhook' }]}
                  {...init('type', {
                    initValue: 'webhook',
                    rules: [
                      {
                        required: true,
                        message: i18n.t('Please select a type'),
                      },
                    ],
                  })}
                  onChange={this.changeType}
                />
              </FormItem>
            </Col>

            <Col span={12} style={{ padding: '0 8px' }}>
              <If condition={this.field.getValue('type') === 'webhook'}>
                <FormItem label={<Translation>PayloadType</Translation>} required>
                  <Select
                    name="payloadType"
                    locale={locale().Select}
                    dataSource={payloadTypeOption}
                    {...init('payloadType', {
                      initValue: 'custom',
                      rules: [
                        {
                          required: true,
                          message: i18n.t('Please select a payloadType'),
                        },
                      ],
                    })}
                  />
                </FormItem>
              </If>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <If condition={this.field.getValue('type') === 'webhook' && this.field.getValue('payloadType') === 'acr'}>
                <FormItem label={<Translation>Registry</Translation>}>
                  <Input
                    name="registry"
                    locale={locale().Input}
                    {...init('registry', {
                      initValue: '',
                      rules: [
                        {
                          pattern: '^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$',
                          message: 'This is a invalid domain',
                        },
                      ],
                    })}
                    placeholder={i18n.t('For the ACR Enterprise Edition, you should set the domain of the registry.')}
                  />
                </FormItem>
              </If>
            </Col>
          </Row>

          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Execution workflow</Translation>} required>
                <Select
                  name="workflowName"
                  locale={locale().Select}
                  dataSource={workflowOption}
                  {...init('workflowName', {
                    rules: [
                      {
                        required: true,
                        message: i18n.t('Please select a workflow'),
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>

            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Component</Translation>} required>
                <Select
                  name="componentName"
                  locale={locale().Select}
                  dataSource={componentsOption}
                  {...init('componentName', {
                    initValue: components.length > 0 && components[0].name,
                    rules: [
                      {
                        required: true,
                        message: i18n.t('Please select a component'),
                      },
                    ],
                  })}
                  onChange={this.changeComponentName}
                />
              </FormItem>
            </Col>
          </Row>
          <Message type="warning" animation={true} visible={this.isShowMessage()} title="Warning">
            <Translation>
              Your component type does not support the image field, and the image update cannot be performed
            </Translation>
          </Message>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default TriggerDialog;
