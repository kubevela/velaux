import React from 'react';
import { Grid, Field, Form, Select, Message, Button, Input } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { createTriggers } from '../../../../api/application';
import { getPayloadType } from '../../../../api/payload';
import type { Workflow, Trigger } from '../../../../interface/application';
import DrawerWithFooter from '../../../../components/Drawer';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import locale from '../../../../utils/locale';

type Props = {
  visible: boolean;
  appName?: string;
  workflows?: Workflow[];
  onOK: () => void;
  onClose: () => void;
  dispatch?: ({}) => {};
  t: (key: string) => {};
};

type State = {
  loading: boolean;
  payloadTypes: string[];
};

class TriggerDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      payloadTypes: ['custom', 'dockerHub', 'ACR', 'harbor', 'artifactory'],
    };
    this.field = new Field(this);
  }

  componentDidMount() {
    const type = this.field.getValue('type');
    if (type === 'webhook') {
      this.onGetPayloadType();
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
      };
      createTriggers(params, query).then((res: any) => {
        if (res) {
          Message.success({
            duration: 4000,
            title: 'Trigger create success.',
            content: 'Trigger create success.',
          });
          this.props.onOK();
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

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const { t, workflows, onClose } = this.props;
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
                  placeholder={t('Please enter the env name').toString()}
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
                  locale={locale.Select}
                  dataSource={[
                    { label: 'On Webhook Event', value: 'webhook' }
                  ]}
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
              <FormItem
                label={<Translation>PayloadType</Translation>}
                help={'Please select type first'}
                required
              >
                <Select
                  name="payloadType"
                  locale={locale.Select}
                  dataSource={payloadTypeOption}
                  {...init('payloadType', {
                    rules: [
                      {
                        required: true,
                        message: 'Please select a payloadType',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Execution workflow</Translation>} required>
                <Select
                  name="workflowName"
                  locale={locale.Select}
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
          </Row>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default withTranslation()(TriggerDialog);
