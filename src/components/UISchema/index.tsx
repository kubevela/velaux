import React, { Component } from 'react';
import { Form, Input, Select, Field, Switch } from '@b-design/ui';
import Translation from '../Translation';
import type { UIParam, UIParamValidate } from '../../interface/application';
import Group from '../../extends/Group';
import ImageInput from '../../extends/ImageInput';
import Strings from '../../extends/Strings';
import SecretSelect from '../../extends/SecretSelect';
import SecretKeySelect from '../../extends/SecretKeySelect';
import Structs from '../../extends/Structs';
import CPUNumber from '../../extends/CPUNumber';
import MemoryNumber from '../../extends/MemoryNumber';
import InnerGroup from '../../extends/InnerGroup';
import K8sObjectsCode from '../../extends/K8sObjectsCode';
import type { Rule } from '@alifd/field';
import KV from '../../extends/KV';
import './index.less';
import { checkImageName, replaceUrl } from '../../utils/common';
import locale from '../../utils/locale';
import HelmValues from '../../extends/HelmValues';

type Props = {
  inline?: boolean;
  id?: string;
  value?: any;
  uiSchema?: UIParam[];
  onChange?: (params: any) => void;
  registerForm?: (form: Field) => void;
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
  secretKeys?: string[];
};

class UISchema extends Component<Props, State> {
  form: Field;
  registerForm: Record<string, Field>;
  constructor(props: Props) {
    super(props);
    this.form = new Field(this, {
      onChange: () => {
        const values = this.form.getValues();
        const { onChange } = this.props;
        if (onChange) onChange(values);
      },
    });
    this.registerForm = {};
    if (this.props.registerForm) {
      this.props.registerForm(this.form);
    }
    this.state = {
      secretKeys: [],
    };
  }

  componentDidMount = () => {
    this.setValues();
  };

  onRegisterForm = (key: string, form: Field) => {
    this.registerForm[key] = form;
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
    this.form.validate((errors) => {
      if (errors) {
        callback('ui schema validate failure');
        return;
      }
      callback();
    });
  };

  render() {
    const { uiSchema, inline } = this.props;
    if (!uiSchema) {
      return <div />;
    }

    const items = uiSchema.map((param) => {
      const init = this.form.init;
      const required = param.validate && param.validate.required;
      if (param.disable) {
        return;
      }

      const validator = (rule: Rule, v: any, callback: (error?: string) => void) => {
        if (this.registerForm[param.jsonKey]) {
          this.registerForm[param.jsonKey].validate((errors: any) => {
            if (errors) {
              callback(`param ${param.jsonKey} validate failure`);
            }
            callback();
          });
        } else if (param.validate.required) {
          callback(`param ${param.jsonKey} is required`);
        } else {
          callback();
        }
      };

      const getGroup = (children: React.ReactNode) => {
        return (
          <Group
            hasToggleIcon
            description={<Translation>{param.description || ''}</Translation>}
            title={<Translation>{param.label || ''}</Translation>}
            closed={true}
            required={param.validate && param.validate.required}
            field={this.form}
            jsonKey={param.jsonKey || ''}
            propertyValue={this.props.value}
            onChange={(values) => {
              if (this.props.onChange) {
                this.props.onChange(values);
              }
            }}
          >
            <Form.Item required={required} disabled={param.disable} key={param.jsonKey}>
              {children}
            </Form.Item>
          </Group>
        );
      };
      const { value } = this.props;
      const initValue = param.validate.defaultValue || (value && value[param.jsonKey]);
      switch (param.uiType) {
        case 'Switch':
          const getDefaultSwtichValue = (validate: any) => {
            if (validate.required === true) {
              return false;
            }
          };
          const switchResult = init(param.jsonKey, {
            initValue: initValue || getDefaultSwtichValue(param.validate),
            rules: converRule(param.validate),
          });
          return (
            <Form.Item
              className="switch-container"
              required={required}
              key={param.jsonKey}
              label={<span title={param.description}>{param.label}</span>}
              help={param.description}
              disabled={param.disable}
            >
              <Switch
                id={switchResult.id}
                onChange={switchResult.onChange}
                size="medium"
                checked={switchResult.value ? true : false}
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
              help={
                <div dangerouslySetInnerHTML={{ __html: replaceUrl(param.description || '') }} />
              }
              disabled={param.disable}
            >
              <Input
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: converRule(param.validate),
                })}
              />
            </Form.Item>
          );
        case 'Password':
          return (
            <Form.Item
              required={required}
              labelAlign={inline ? 'inset' : 'left'}
              label={param.label}
              key={param.jsonKey}
              help={
                <div dangerouslySetInnerHTML={{ __html: replaceUrl(param.description || '') }} />
              }
              disabled={param.disable}
            >
              <Input
                htmlType="password"
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: converRule(param.validate),
                })}
              />
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
                locale={locale.Select}
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: converRule(param.validate),
                })}
                dataSource={param.validate && param.validate.options}
              />
            </Form.Item>
          );
        case 'Number':
          return (
            <Form.Item
              labelAlign={inline ? 'inset' : 'left'}
              required={required}
              label={param.label}
              key={param.jsonKey}
              help={param.description}
              disabled={param.disable}
            >
              <Input
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: converRule(param.validate),
                })}
                htmlType="number"
              />
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
                  initValue: initValue,
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
          const children = (
            <KV
              {...init(param.jsonKey, {
                initValue: initValue,
                rules: converRule(param.validate),
              })}
              key={param.jsonKey}
              additional={param.additional}
              additionalParameter={param.additionalParameter}
            />
          );
          return getGroup(children);
        case 'HelmValues':
          return getGroup(
            <HelmValues
              {...init(param.jsonKey, {
                initValue: initValue,
                rules: converRule(param.validate),
              })}
              key={param.jsonKey}
              additional={param.additional}
              additionalParameter={param.additionalParameter}
            />,
          );
        case 'Strings':
          return getGroup(
            <Strings
              key={param.jsonKey}
              {...init(param.jsonKey, {
                initValue: initValue,
                rules: converRule(param.validate),
              })}
            />,
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
                setKeys={(keys: string[]) => {
                  this.setState({ secretKeys: keys });
                }}
                {...init(param.jsonKey, {
                  initValue: param.validate.defaultValue || this.props.value?.name,
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
                  initValue: param.validate.defaultValue || this.props.value?.key,
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
                  initValue: initValue,
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
                  initValue: initValue,
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
            return (
              <Group
                key={param.jsonKey}
                hasToggleIcon
                description={<Translation>{param.description || ''}</Translation>}
                title={<Translation>{param.label || ''}</Translation>}
                closed={true}
                required={param.validate && param.validate.required}
                field={this.form}
                jsonKey={param.jsonKey || ''}
                propertyValue={this.props.value}
                onChange={(values) => {
                  if (this.props.onChange) {
                    this.props.onChange(values);
                  }
                }}
              >
                <UISchema
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: [
                      {
                        validator: validator,
                      },
                    ],
                  })}
                  registerForm={(form: Field) => {
                    this.onRegisterForm(param.jsonKey, form);
                  }}
                  uiSchema={param.subParameters}
                />
              </Group>
            );
          }
          return <div />;
        case 'InnerGroup':
          return (
            <InnerGroup
              key={param.jsonKey}
              uiSchema={param.subParameters}
              title={param.label}
              description={param.description}
              {...init(param.jsonKey, {
                initValue: initValue,
                rules: converRule(param.validate),
              })}
            />
          );
        case 'Structs':
          if (param.subParameters && param.subParameters.length > 0) {
            return getGroup(
              <Structs
                key={param.jsonKey}
                label={param.label}
                param={param.subParameters}
                parameterGroupOption={param.subParameterGroupOption}
                registerForm={(form: Field) => {
                  this.onRegisterForm(param.jsonKey, form);
                }}
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: [
                    {
                      validator: validator,
                      message: `Please check ${param.label} config`,
                    },
                  ],
                })}
              />,
            );
          }
          return <div />;
        case 'Ignore':
          if (param.subParameters && param.subParameters.length > 0) {
            return (
              <UISchema
                key={param.jsonKey}
                uiSchema={param.subParameters}
                registerForm={(form: Field) => {
                  this.onRegisterForm(param.jsonKey, form);
                }}
                inline={inline}
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: [
                    {
                      validator: validator,
                    },
                  ],
                })}
              />
            );
          }
          return <div />;
        case 'K8sObjectsCode':
          return (
            <Form.Item
              required={required}
              label={param.label}
              help={param.description}
              disabled={param.disable}
              key={param.jsonKey}
            >
              <K8sObjectsCode
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: [
                    {
                      required: param.validate.required,
                      message: 'Please enter a valid kubernetes resource yaml code',
                    },
                  ],
                })}
              />
            </Form.Item>
          );
      }
    });
    return (
      <Form field={this.form} className="ui-schema-container">
        {items}
      </Form>
    );
  }
}

export default UISchema;
