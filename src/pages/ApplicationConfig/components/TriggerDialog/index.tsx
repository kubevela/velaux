import React from 'react';
import { Grid, Field, Form, Select, Message, Button, Input } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { createTriggers, detailComponentDefinition } from '../../../../api/application';
import { getPayloadType } from '../../../../api/payload';
import type {
  Workflow,
  Trigger,
  UIParam,
  ApplicationComponentBase,
} from '../../../../interface/application';
import DrawerWithFooter from '../../../../components/Drawer';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import locale from '../../../../utils/locale';
import { If } from 'tsx-control-statements/components';

type Props = {
  visible: boolean;
  appName?: string;
  workflows?: Workflow[];
  componentType: string;
  onOK: (params: Trigger) => void;
  onClose: () => void;
  dispatch?: ({}) => {};
  t: (key: string) => {};
  components: ApplicationComponentBase[];
};

type State = {
  loading: boolean;
  payloadTypes: string[];
  hasImage: boolean;
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
    const { componentType } = this.props;
    const type = this.field.getValue('type');
    if (type === 'webhook') {
      this.onGetPayloadType();
    }

    if (componentType) {
      this.onDetailComponentDefinition(componentType);
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
          const findImageObj = (res.uiSchema || []).find(
            (item: UIParam) => item.jsonKey === 'image',
          );
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
      } = values;
      const query = { appName };
      const params: Trigger = {
        name,
        alias,
        description,
        type,
        payloadType,
        workflowName,
        token: '',
        componentName,
      };
      createTriggers(params, query).then((res: any) => {
        if (res) {
          Message.success({
            duration: 4000,
            title: 'Trigger create success.',
            content: 'Trigger create success.',
          });
          this.props.onOK(res);
        }
      });
    });
  };

  extButtonList = () => {
    const { onClose } = this.props;
    return (
      <div>
        <Button type="secondary" onClick={onClose} className="margin-right-10">
          <Translation>Cancel</Translation>
        </Button>
        <Button type="primary" onClick={this.onSubmit}>
          <Translation>Create</Translation>
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
    const { componentType } = this.props;
    const { hasImage } = this.state;
    const type = this.field.getValue('type');
    const payloadType = this.field.getValue('payloadType');
    const components = ['webservice', 'worker', 'task'];
    const isNotInclude = !components.includes(componentType);
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
      if (c.name == value) {
        componentType = c.componentType;
      }
    });
    this.onDetailComponentDefinition(componentType);
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const { t, workflows, onClose, components } = this.props;
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
        title={t('Add Trigger')}
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
                  placeholder={t('Please enter the name').toString()}
                  {...init('name', {
                    rules: [
                      {
                        required: true,
                        pattern: checkName,
                        message: 'Please enter a valid English name',
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
                  placeholder={t('Please enter').toString()}
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
                  placeholder={t('Please enter').toString()}
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

          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Type</Translation>} required>
                <Select
                  name="type"
                  locale={locale().Select}
                  dataSource={[{ label: 'On Webhook Event', value: 'webhook' }]}
                  {...init('type', {
                    initValue: 'webhook',
                    rules: [
                      {
                        required: true,
                        message: 'Please select a type',
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
                          message: 'Please select a payloadType',
                        },
                      ],
                    })}
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
                        message: 'Please select a workflow',
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
                        message: 'Please select a component',
                      },
                    ],
                  })}
                  onChange={this.changeComponentName}
                />
              </FormItem>
            </Col>
          </Row>
          <Message type="warning" animation={true} visible={this.isShowMessage()} title="Warning">
            Your component type does not support the image field, and the image update cannot be
            performed.
          </Message>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default withTranslation()(TriggerDialog);
