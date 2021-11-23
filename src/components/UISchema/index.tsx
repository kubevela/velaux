import React, { Component } from 'react';
import { Form, Input, Select, Field, Balloon } from '@b-design/ui';
import Translation from '../Translation';
import { UIParam, UIParamValidate } from '../../interface/application';
import Group from '../../extends/Group';
import ImageInput from '../../extends/ImageInput';
import Strings from '../../extends/Strings';
import SecretSelect from '../../extends/SecretSelect';
import SecretKeySelect from '../../extends/SecretKeySelect';
import Structs from '../../extends/Structs';
import CPUNumber from '../../extends/CPUNumber';
import MemoryNumber from '../../extends/MemoryNumber';
import SwitchComponent from '../../extends/Switch';
import InnerGroup from '../../extends/InnerGroup';
import { Rule } from '@alifd/field';
import KV from '../../extends/KV';
import './index.less';
import { checkImageName } from '../../utils/common';

type Props = {
  _key?: string;
  inline?: boolean;
  id?: string;
  value?: any;
  uiSchema?: Array<UIParam>;
  onChange?: (params: any) => void;
  ref: any;
};

function converRule(validete: UIParamValidate) {
  const rules = [];
  if (!validete) {
    return [];
  }
  if (validete.required) {
    rules.push({
      required: true,
      message: 'This field is required.',
    });
  }
  if (validete.min) {
    rules.push({
      min: validete.min,
      message: 'Enter a number greater than ' + validete.min,
    });
  }
  if (validete.max) {
    rules.push({
      max: validete.max,
      message: 'Enter a number less than ' + validete.max,
    });
  }
  if (validete.minLength) {
    rules.push({
      minLength: validete.minLength,
      message: `Enter a minimum of ${validete.minLength} characters.`,
    });
  }
  if (validete.maxLength) {
    rules.push({
      maxLength: validete.maxLength,
      message: `Enter a maximum of ${validete.maxLength} characters.`,
    });
  }
  if (validete.pattern) {
    rules.push({
      pattern: validete.pattern,
      message: `Please enter a value that conforms to the specification. ` + validete.pattern,
    });
  }
  return rules;
}

type State = {
  secretKeys?: Array<string>;
};

class UISchema extends Component<Props, State> {
  form: Field;
  constructor(props: Props) {
    super(props);
    this.form = new Field(this, {
      onChange: () => {
        const values = this.form.getValues();
        const { onChange } = this.props;
        if (onChange) onChange(values);
      },
    });
    this.state = {
      secretKeys: [],
    };
  }

  componentDidMount = () => {
    this.setValues();
  };

  setValues = () => {
    const { value } = this.props;
    if (value) {
      this.form.setValues(value);
    }
    const values = this.form.getValues();
    const { onChange } = this.props;
    if (onChange) onChange(values);
  };

  validate = (callback: (error?: string) => void) => {
    this.form.validate((errors, values) => {
      if (errors) {
        callback('ui schema validate failure');
        return;
      }
      callback();
    });
  };

  ParseParam = (param: UIParam, inline: boolean | undefined) => {
    let init = this.form.init;
    const required = param.validate && param.validate.required;
    if (param.disable) {
      return;
    }
    switch (param.uiType) {
      case 'Switch':
        return (
          <Form.Item
            className="switch-container"
            required={required}
            key={param.jsonKey}
            labelAlign={inline ? 'inset' : 'left'}
            label={param.label}
            help={param.description}
            disabled={param.disable}
          >
            <SwitchComponent
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: converRule(param.validate),
              })}
            />
          </Form.Item>
        );
      case 'Input':
        return (
          <Form.Item
            required={required}
            labelAlign={inline ? 'inset' : 'left'}
            label={param.label}
            key={param.jsonKey}
            help={param.description}
            disabled={param.disable}
          >
            <Input
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: converRule(param.validate),
              })}
            ></Input>
          </Form.Item>
        );
      case 'Select':
        return (
          <Form.Item
            required={required}
            labelAlign={inline ? 'inset' : 'left'}
            label={param.label}
            key={param.jsonKey}
            help={param.description}
            disabled={param.disable}
          >
            <Select
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: converRule(param.validate),
              })}
              dataSource={param.validate && param.validate.options}
            ></Select>
          </Form.Item>
        );
      case 'Number':
        return (
          <Form.Item
            required={required}
            label={param.label}
            key={param.jsonKey}
            help={param.description}
            disabled={param.disable}
          >
            <Input
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: converRule(param.validate),
              })}
              htmlType="number"
            ></Input>
          </Form.Item>
        );
      case 'ImageInput':
        return (
          <Form.Item
            required={required}
            label={param.label}
            help={param.description}
            disabled={param.disable}
            key={param.jsonKey}
          >
            <ImageInput
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: [
                  {
                    required: true,
                    pattern: checkImageName,
                    message: 'Please enter a valid image name',
                  },
                ],
              })}
            />
          </Form.Item>
        );
      case 'KV':
        return (
          <Group
            hasToggleIcon
            description={<Translation>{param.description || ''}</Translation>}
            title={<Translation>{param.label || ''}</Translation>}
            closed={true}
            key={param.jsonKey}
          >
            <Form.Item required={required} disabled={param.disable} key={param.jsonKey}>
              <KV
                {...init(param.jsonKey, {
                  initValue: param.validate.defaultValue,
                  rules: converRule(param.validate),
                })}
              />
            </Form.Item>
          </Group>
        );
      case 'Strings':
        return (
          <Group
            hasToggleIcon
            description={<Translation>{param.description || ''}</Translation>}
            title={<Translation>{param.label || ''}</Translation>}
            closed={true}
            key={param.jsonKey}
          >
            <Form.Item required={required} disabled={param.disable} key={param.jsonKey}>
              <Strings
                {...init(param.jsonKey, {
                  initValue: param.validate.defaultValue,
                  rules: converRule(param.validate),
                })}
              />
            </Form.Item>
          </Group>
        );
      case 'SecretSelect':
        return (
          <Form.Item
            labelAlign={inline ? 'inset' : 'left'}
            required={required}
            label={param.label}
            help={param.description}
            disabled={param.disable}
            key={param.jsonKey}
          >
            <SecretSelect
              setKeys={(keys: Array<string>) => {
                this.setState({ secretKeys: keys });
              }}
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: converRule(param.validate),
              })}
            />
          </Form.Item>
        );
      case 'SecretKeySelect':
        return (
          <Form.Item
            required={required}
            labelAlign={inline ? 'inset' : 'left'}
            label={param.label}
            help={param.description}
            disabled={param.disable}
            key={param.jsonKey}
          >
            <SecretKeySelect
              secretKeys={this.state.secretKeys}
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: converRule(param.validate),
              })}
            />
          </Form.Item>
        );
      case 'CPUNumber':
        return (
          <Form.Item
            required={required}
            label={param.label}
            help={param.description}
            disabled={param.disable}
            key={param.jsonKey}
          >
            <CPUNumber
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: [
                  {
                    required: param.validate.required,
                    min: 0,
                    message: 'Please enter a valid cpu request number',
                  },
                ],
              })}
            />
          </Form.Item>
        );
      case 'MemoryNumber':
        return (
          <Form.Item
            required={required}
            label={param.label}
            help={param.description}
            disabled={param.disable}
            key={param.jsonKey}
          >
            <MemoryNumber
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: [
                  {
                    required: param.validate.required,
                    min: 0,
                    message: 'Please enter a valid memory request number',
                  },
                ],
              })}
            />
          </Form.Item>
        );
      case 'Group':
        if (param.subParameters && param.subParameters.length > 0) {
          const ref: React.RefObject<UISchema> = React.createRef();
          const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
            ref.current?.validate(callback);
          };
          return (
            <Group
              hasToggleIcon
              description={<Translation>{param.description || ''}</Translation>}
              title={<Translation>{param.label || ''}</Translation>}
              closed={true}
              required={param.validate && param.validate.required}
            >
              <UISchema
                {...init(param.jsonKey, {
                  initValue: param.validate.defaultValue,
                  rules: [
                    // {
                    //   validator: validator,
                    //   message: `Please check ${param.label} config`,
                    // },
                  ],
                })}
                uiSchema={param.subParameters}
                ref={ref}
              />
            </Group>
          );
        }
        return <div></div>;
      case 'InnerGroup':
        return (
          <InnerGroup
            key={param.jsonKey}
            uiSchema={param.subParameters}
            title={param.label}
            description={param.description}
            {...init(param.jsonKey, {
              initValue: param.validate.defaultValue,
              rules: converRule(param.validate),
            })}
          />
        );
      case 'Structs':
        if (param.subParameters && param.subParameters.length > 0) {
          const ref: React.RefObject<Structs> = React.createRef();
          const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
            ref.current?.validate(callback);
          };
          return (
            <Group
              hasToggleIcon
              description={<Translation>{param.description || ''}</Translation>}
              title={<Translation>{param.label || ''}</Translation>}
              closed={true}
            >
              <Form.Item>
                <Structs
                  ref={ref}
                  param={param.subParameters}
                  parameterGroupOption={param.subParameterGroupOption}
                  {...init(param.jsonKey, {
                    initValue: param.validate.defaultValue,
                    // rules: [
                    //   {
                    //     validator: validator,
                    //     message: `Please check ${param.label} config`,
                    //   },
                    // ],
                  })}
                />
              </Form.Item>
            </Group>
          );
        }
        return <div></div>;
      case 'Ignore':
        if (param.subParameters && param.subParameters.length > 0) {
          const ref: React.RefObject<UISchema> = React.createRef();
          const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
            ref.current?.validate(callback);
          };
          return (
            <UISchema
              ref={ref}
              key={param.jsonKey}
              uiSchema={param.subParameters}
              inline={inline}
              {...init(param.jsonKey, {
                initValue: param.validate.defaultValue,
                rules: [
                  {
                    validator: validator,
                    message: `Please check ${param.label} config`,
                  },
                ],
              })}
            />
          );
        }
        return <div></div>;
    }
  };

  render() {
    const { uiSchema, inline } = this.props;
    if (!uiSchema) {
      return <div></div>;
    }

    const items = uiSchema.map((param) => {
      return this.ParseParam(param, inline);
    });
    return (
      <Form field={this.form} className="ui-schema-container">
        {items}
      </Form>
    );
  }
}

export default UISchema;
