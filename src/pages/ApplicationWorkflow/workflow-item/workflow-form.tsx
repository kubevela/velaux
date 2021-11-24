import React, { Component } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _ from 'lodash';
import type { DiagramMakerNode } from 'diagram-maker';
import type { WorkFlowNodeType } from '../entity';

import { Grid, Field, Form, Select, Button, Input, Message } from '@b-design/ui';
import type { Rule } from '@alifd/field';
import { withTranslation } from 'react-i18next';
import Group from '../../../extends/Group';
import { If } from 'tsx-control-statements/components';
import { detailWorkFLowDefinition } from '../../../api/workflows';
import type { DefinitionDetail } from '../../../interface/application';
import UISchema from '../../../components/UISchema';
import Translation from '../../../components/Translation';
import { checkName } from '../../../utils/common';

import './index.less';

type Props = {
  createOrUpdateNode: (data: any) => void;
  data: DiagramMakerNode<WorkFlowNodeType>;
  workFlowDefinitions: [];
  appName?: string;
  componentName?: string;
  closeDrawer?: () => void;
  dispatch?: ({}) => {};
  t: (key: string) => {};
};

type State = {
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
};

class WorkflowForm extends Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {
      definitionLoading: false,
    };
    this.field = new Field(this);
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount = () => {
    const { consumerData } = this.props.data;
    this.field.setValues(consumerData || '');
    const properties =
      consumerData && consumerData.properties && JSON.parse(consumerData.properties);
    this.field.setValues({ properties: properties });
    this.onDetailsComponeDefinition((consumerData && consumerData.type) || '');
  };

  submit = () => {
    this.field.validate((error, values) => {
      if (error) {
        return;
      }
      this.props.createOrUpdateNode(values);
    });
  };

  setValues = (values: any | null) => {
    if (values) {
      const { consumerData } = values;
      this.field.setValues(consumerData);
    }
  };

  onSubmit = () => {
    this.field.validate((error, values) => {
      if (error) {
        return;
      }
      this.props.createOrUpdateNode(values);
      Message.warning('please click the save button in the upper right, corner to save the data ');
    });
  };

  transDefinitions() {
    const { workFlowDefinitions } = this.props;
    return (workFlowDefinitions || []).map((item: { name: string }) => ({
      lable: item.name,
      value: item.name,
    }));
  }

  onDetailsComponeDefinition = (value: string, callback?: () => void) => {
    this.setState({ definitionLoading: true });
    detailWorkFLowDefinition({ name: value })
      .then((re) => {
        if (re) {
          this.setState({ definitionDetail: re, definitionLoading: false });
          if (callback) {
            callback();
          }
        }
      })
      .catch(() => this.setState({ definitionLoading: false }));
  };

  handleChang = (value: string) => {
    this.onDetailsComponeDefinition(value);
    this.field.setValues({ type: value });
  };

  render() {
    const { init } = this.field;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const { t } = this.props;
    const { definitionDetail } = this.state;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };

    return (
      <div>
        <Form field={this.field}>
          <Row>
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Workflow Type</Translation>} required>
                <Select
                  className="select"
                  placeholder={t('Please chose').toString()}
                  {...init(`type`, {
                    rules: [
                      {
                        required: true,
                        message: 'Please chose',
                      },
                    ],
                  })}
                  dataSource={this.transDefinitions()}
                  onChange={this.handleChang}
                />
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem
                label={<Translation>Name</Translation>}
                labelTextAlign="left"
                required={true}
              >
                <Input
                  htmlType="name"
                  name="name"
                  maxLength={32}
                  placeholder={t('Please enter').toString()}
                  {...init('name', {
                    rules: [
                      {
                        required: true,
                        pattern: checkName,
                        message: 'Please enter a valid application name',
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
          </Row>

          <Row>
            <Col span={24} style={{ padding: '0 8px' }}>
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
            <Col span={24} style={{ padding: '0 8px' }}>
              <Group
                title="Workflow Properties"
                description="Set the configuration parameters for the Workflow."
                closed={false}
                required={true}
              >
                <If condition={definitionDetail && definitionDetail.uiSchema}>
                  <FormItem required={true}>
                    <UISchema
                      {...init(`properties`, {
                        rules: [
                          {
                            validator: validator,
                            message: 'Please check workflow deploy properties',
                          },
                        ],
                      })}
                      uiSchema={definitionDetail && definitionDetail.uiSchema}
                      ref={this.uiSchemaRef}
                    />
                  </FormItem>
                </If>
              </Group>
            </Col>
          </Row>
        </Form>

        <div style={{ display: 'flex', justifyContent: 'end' }}>
          <Button type="secondary" onClick={this.props.closeDrawer} className="margin-right-10">
            <Translation>Cancle</Translation>
          </Button>
          <Button type="primary" onClick={this.onSubmit}>
            <Translation>Confirm</Translation>
          </Button>
        </div>
      </div>
    );
  }
}

export default withTranslation()(WorkflowForm);
