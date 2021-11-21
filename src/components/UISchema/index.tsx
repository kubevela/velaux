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

export function ParseParam(param: UIParam, inline: boolean | undefined, init: any) {
  const required = param.validate && param.validate.required;
  switch (param.uiType) {
    case 'Switch':
      return (
        <Form.Item
          className="switch-container"
          required={required}
          labelAlign={inline ? 'inset' : 'left'}
          label={
            inline ? (
              <Balloon trigger={param.label} align="t">
                <div>
                  <div style={{ fontWeight: 'bold' }}>{param.label}</div>
                  <div>{param.description}</div>
                </div>
              </Balloon>
            ) : (
              param.label
            )
          }
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
          label={
            inline ? (
              <Balloon trigger={param.label} align="t">
                <div>
                  <div style={{ fontWeight: 'bold' }}>{param.label}</div>
                  <div>{param.description}</div>
                </div>
              </Balloon>
            ) : (
              param.label
            )
          }
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
          label={
            inline ? (
              <Balloon trigger={param.label} align="t">
                <div>
                  <div style={{ fontWeight: 'bold' }}>{param.label}</div>
                  <div>{param.description}</div>
                </div>
              </Balloon>
            ) : (
              param.label
            )
          }
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
        >
          <ImageInput
            {...init(param.jsonKey, {
              initValue: param.validate.defaultValue,
              rules: converRule(param.validate),
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
        >
          <Form.Item>
            <UISchema
              uiSchema={param.subParameters}
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
        >
          <Strings
            {...init(param.jsonKey, {
              initValue: param.validate.defaultValue,
              rules: converRule(param.validate),
            })}
          />
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
        >
          <SecretSelect
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
        >
          <SecretKeySelect
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
          label={
            inline ? (
              <Balloon trigger={param.label} align="t">
                <div>
                  <div style={{ fontWeight: 'bold' }}>{param.label}</div>
                  <div>{param.description}</div>
                </div>
              </Balloon>
            ) : (
              param.label
            )
          }
          help={param.description}
          disabled={param.disable}
        >
          <CPUNumber
            {...init(param.jsonKey, {
              initValue: param.validate.defaultValue,
              rules: converRule(param.validate),
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
        >
          <MemoryNumber
            {...init(param.jsonKey, {
              initValue: param.validate.defaultValue,
              rules: converRule(param.validate),
            })}
          />
        </Form.Item>
      );
    case 'Group':
      if (param.subParameters && param.subParameters.length > 0) {
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
                rules: converRule(param.validate),
              })}
              uiSchema={param.subParameters}
              _key={param.jsonKey}
            />
          </Group>
        );
      }
      return <div></div>;
    case 'InnerGroup':
      return (
        <InnerGroup
          _key={param.jsonKey}
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
                _key={param.jsonKey}
                param={param.subParameters}
                parameterGroupOption={param.subParameterGroupOption}
                {...init(param.jsonKey, {
                  initValue: param.validate.defaultValue,
                  rules: [
                    // {
                    //   validator: validator,
                    //   message: `Please check ${param.label} config`,
                    // },
                  ],
                })}
              />
            </Form.Item>
          </Group>
        );
      }
      return <div></div>;
    case 'Ignore':
      if (param.subParameters && param.subParameters.length > 0) {
        return (
          <UISchema
            _key={param.jsonKey}
            uiSchema={param.subParameters}
            inline={inline}
            {...init(param.jsonKey, {
              initValue: param.validate.defaultValue,
              rules: converRule(param.validate),
            })}
          />
        );
      }
      return <div></div>;
  }
}

class UISchema extends Component<Props> {
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

  render() {
    const { uiSchema, inline } = this.props;
    let init = this.form.init;
    if (!uiSchema) {
      return <div></div>;
    }

    const items = uiSchema.map((param) => {
      return ParseParam(param, inline, init);
    });
    return (
      <Form field={this.form} className="ui-schema-container">
        {items}
      </Form>
    );
  }
}

export default UISchema;
