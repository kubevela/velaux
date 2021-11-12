import React, { Component } from 'react';
import { Grid, Form, Input, Select, Field, Message } from '@b-design/ui';
import {
  COMPONENT_NAME,
  COMPONENT_ALIAS,
  COMPONENT_DESCRIPTION,
  COMPONENT_DEPENDENCY,
  NEW_COMPONENTS,
} from '../../constants';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import { EnvBind } from '../../../../interface/application';
import Group from '../../../../extends/Group';
import { detailComponentDefinition, createApplicationComponent } from '../../../../api/application';
import { DefinitionDetail } from '../../../../interface/application';
import UISchema from '../../../../components/UISchema';
import DrawerWithFooter from '../../../../components/Drawer';
import './index.less';

type Props = {
  appName: string;
  envBind: EnvBind[];
  componentType: string;
  componentDefinitions: [];
  components: [];
  onClose: () => void;
  onOK: () => void;
};

type State = {
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
};

class AddComponent extends Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {
      definitionLoading: true,
    };
    this.field = new Field(this);
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    this.loadComponentUISchema();
  }

  loadComponentUISchema() {
    const { componentType } = this.props;

    detailComponentDefinition({ name: componentType }).then((re) => {
      if (re) {
        this.setState({ definitionDetail: re, definitionLoading: false });
      }
    });
  }

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

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { name, alias, description, envNames = [], dependsOn, icon = '' } = values;
      const { appName, componentType } = this.props;
      const params = {
        appName,
        body: {
          name,
          alias,
          description,
          icon,
          componentType: componentType,
          dependsOn: dependsOn,
          envNames: envNames,
          properties: '{}',
        },
      };
      this.uiSchemaRef.current?.validate((error: any, values: any) => {
        if (error) {
          return;
        }
        params.body.properties = JSON.stringify(values);
        console.log(params, 'params');

        // createApplicationComponent(params).then((res) => {
        //   if (res) {
        //     Message.success(<Translation>create service add success</Translation>);
        //     this.props.onOK();
        //   }
        // });
      });
    });
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const formItemLayout = {
      labelCol: { fixedSpan: 4 },
    };

    const { onClose } = this.props;

    const { definitionLoading, definitionDetail } = this.state;

    return (
      <DrawerWithFooter
        title={NEW_COMPONENTS}
        placement="right"
        width={600}
        onClose={onClose}
        onOk={this.onSubmit}
      >
        <Form field={this.field}>
          <Group
            title={<Translation>Component Basic Info</Translation>}
            description={<Translation>Set the basic properties of the service</Translation>}
            hasToggleIcon
          >
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
                <FormItem {...formItemLayout} labelAlign={'top'} label={COMPONENT_ALIAS}>
                  <Input
                    placeholder="Enter a service alias name"
                    {...init('alias', {
                      rules: [
                        {
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
                <FormItem {...formItemLayout} labelAlign={'top'} label={COMPONENT_DESCRIPTION}>
                  <Input
                    placeholder="Enter a service description:"
                    {...init('description', {
                      rules: [
                        {
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
              <Col span="24">
                <FormItem
                  {...formItemLayout}
                  labelAlign={'top'}
                  label={<Translation>EnvironmentPlan</Translation>}
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
          </Group>
          <Group
            title="Deployment Parameters"
            description="Automatically generated based on definition"
            loading={definitionLoading}
          >
            <UISchema
              _key="body.properties"
              uiSchema={definitionDetail && definitionDetail.uiSchema}
              ref={this.uiSchemaRef}
            ></UISchema>
          </Group>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default AddComponent;
