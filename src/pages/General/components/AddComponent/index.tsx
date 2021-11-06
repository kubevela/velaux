import React, { Component } from 'react';
import { Grid, Form, Button, Input, Select, Field, Icon, Message, Loading } from '@b-design/ui';
import {
  NEW_COMPONENTS,
  COMPONENT_NAME,
  COMPONENT_ALIAS,
  COMPONENT_DESCRIPTION,
  COMPONENT_DEPENDENCY,
  LABEL,
  ENVIRONMENT_BINDING,
  INHERIT_ENVIRONMENTAL_PLANNING,
  COMPONENT_CONFIGURATION,
  CREATE,
} from '../../constants';
import Translation from '../../../../components/Translation';
import LabelPlan from '../LabelPlan';
import { createApplicationComponent } from '../../../../api/application';
import { checkName } from '../../../../utils/common';

import './index.less';

type Props = {
  appName: string;
  envBind: [];
  componentType: string;
  componentDefinitions: [];
  components: [];
  getComponents: () => void;
  onClose: () => void;
};
class AddComponent extends Component<Props> {
  field: Field;
  labelPlan: React.RefObject<LabelPlan>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.labelPlan = React.createRef();
  }

  resetField() {
    this.field.setValues({
      name: '',
      alias: '',
      description: '',
      dependsOn: '',
      envNames: '',
      icon: '',
    });
  }

  handleClickCreate = () => {
    //Todo Label field type need Array,now API label type is Object
    const labelPlanArr = this.labelPlan.current?.getValues();
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { name, alias, description, envNames = [], dependsOn, icon = '' } = values;
      const { appName, componentType } = this.props;
      const params = {
        name: appName,
        body: {
          name,
          alias,
          description,
          icon,
          componentType: componentType,
          dependsOn: dependsOn,
          envNames: envNames,
          labels: {},
        },
      };

      createApplicationComponent(params).then((res) => {
        if (res) {
          Message.success(<Translation>create service add success</Translation>);
          this.props.onClose();
          this.resetField();
          this.props.getComponents();
        }
      });
    });
  };

  transComponentDefinitions() {
    const { components } = this.props;
    return (components || []).map((item: { name: string }) => ({
      lable: item.name,
      value: item.name,
    }));
  }

  transEnvBind() {
    const { envBind } = this.props;
    return (envBind || []).map((item: { name: string }) => ({
      lable: item.name,
      value: item.name,
    }));
  }

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const formItemLayout = {
      labelCol: { fixedSpan: 4 },
    };

    return (
      <div className="add-component">
        <Row>
          {' '}
          <hr />{' '}
        </Row>
        <Form field={this.field}>
          <Row>
            <Col span="12">
              <FormItem {...formItemLayout} labelAlign={'top'} label={COMPONENT_NAME} required>
                <Input
                  placeholder="Enter a service name"
                  {...init('name', {
                    rules: [
                      {
                        required: true,
                        pattern: checkName,
                        message: 'Please enter a valid service name',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>

            <Col span="12" className="padding-left-10">
              <FormItem {...formItemLayout} labelAlign={'top'} label={COMPONENT_ALIAS} required>
                <Input
                  placeholder="Enter a service alias name:"
                  {...init('alias', {
                    rules: [
                      {
                        required: true,
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
            <Col span="24">
              <FormItem
                {...formItemLayout}
                labelAlign={'top'}
                label={COMPONENT_DESCRIPTION}
                required
              >
                <Input
                  placeholder="Enter a service description:"
                  {...init('description', {
                    rules: [
                      {
                        required: true,
                        maxLength: 128,
                        message: 'Enter a description less than 128 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col span="24">
              <FormItem {...formItemLayout} labelAlign={'top'} label={COMPONENT_DEPENDENCY}>
                <Select
                  className="component-dependency"
                  mode={'multiple'}
                  dataSource={this.transComponentDefinitions()}
                  {...init('dependsOn', {
                    rules: [
                      {
                        required: false,
                        message: 'Chose a service depends',
                      },
                    ],
                  })}
                  placeholder={'Chose a service depends'}
                />
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col span={'24'}>
              <FormItem label={LABEL} required={false}>
                <LabelPlan ref={this.labelPlan} />
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col span="24">
              <FormItem
                {...formItemLayout}
                labelAlign={'top'}
                label={INHERIT_ENVIRONMENTAL_PLANNING}
              >
                <Select
                  className="component-env"
                  mode={'multiple'}
                  dataSource={this.transEnvBind()}
                  {...init('envNames', {
                    rules: [
                      {
                        required: false,
                        message: 'Chose a envNames',
                      },
                    ],
                  })}
                  placeholder={'Chose a envNames'}
                />
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                style={{ marginRight: '5px' }}
                onClick={this.handleClickCreate}
              >
                {CREATE}
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
}

export default AddComponent;
