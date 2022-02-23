import React, { Component } from 'react';
import { Form, Input, Select, Field, Switch, Grid, Divider } from '@b-design/ui';
import Translation from '../Translation';
import type { UIParam, UIParamValidate } from '../../interface/application';
import Group from '../../extends/Group';
import ImageInput from '../../extends/ImageInput';
import Strings from '../../extends/Strings';
import SecretSelect from '../../extends/SecretSelect';
import SecretKeySelect from '../../extends/SecretKeySelect';
import Structs from '../../extends/Structs';
import CPUNumber from '../../extends/CPUNumber';
import DiskNumber from '../../extends/DiskNumber';
import MemoryNumber from '../../extends/MemoryNumber';
import K8sObjectsCode from '../../extends/K8sObjectsCode';
import type { Rule } from '@alifd/field';
import KV from '../../extends/KV';
import './index.less';
import { checkImageName, replaceUrl } from '../../utils/common';
import locale from '../../utils/locale';
import HelmValues from '../../extends/HelmValues';
import { If } from 'tsx-control-statements/components';
import i18n from 'i18next';

const { Col, Row } = Grid;

type Props = {
  inline?: boolean;
  id?: string;
  value?: any;
  uiSchema?: UIParam[];
  maxColSpan?: number;
  onChange?: (params: any) => void;
  registerForm?: (form: Field) => void;
  disableRenderRow?: boolean;
  mode: 'new' | 'edit';
};

function convertRule(validate: UIParamValidate) {
  const rules = [];
  if (!validate) {
    return [];
  }
  if (validate.required) {
    rules.push({
      required: true,
      message: 'This field is required.',
    });
  }
  if (validate.min != undefined) {
    rules.push({
      min: validate.min,
      message: 'Enter a number greater than ' + validate.min,
    });
  }
  if (validate.max != undefined) {
    rules.push({
      max: validate.max,
      message: 'Enter a number less than ' + validate.max,
    });
  }
  if (validate.minLength != undefined) {
    rules.push({
      minLength: validate.minLength,
      message: `Enter a minimum of ${validate.minLength} characters.`,
    });
  }
  if (validate.maxLength != undefined) {
    rules.push({
      maxLength: validate.maxLength,
      message: `Enter a maximum of ${validate.maxLength} characters.`,
    });
  }
  if (validate.pattern) {
    rules.push({
      pattern: new RegExp(validate.pattern),
      message: `Please enter a value that conforms to the specification. ` + validate.pattern,
    });
  }
  return rules;
}

type State = {
  secretKeys?: string[];
  advanced: boolean;
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
      advanced: false,
    };
  }

  componentDidMount = () => {
    this.setValues();
  };

  onRegisterForm = (key: string, form: Field) => {
    this.registerForm[key] = form;
  };

  onChangeAdvanced = (advanced: boolean) => {
    this.setState({ advanced: advanced });
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
    const { advanced } = this.state;
    const { uiSchema, inline, maxColSpan, disableRenderRow, value } = this.props;
    if (!uiSchema) {
      return <div />;
    }
    let onlyShowRequired = false;
    if (uiSchema.length > 5) {
      onlyShowRequired = true;
    }
    const items = uiSchema.map((param) => {
      const init = this.form.init;
      const required = param.validate && param.validate.required;
      if (param.disable) {
        return;
      }

      if (onlyShowRequired && !param.validate.required && !advanced) {
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

      let description = param.description;
      if (description) {
        description = i18n.t(description);
      }
      let label = param.label;
      if (label) {
        label = i18n.t(label);
      }
      const initValue = (value && value[param.jsonKey]) || param.validate.defaultValue;
      const disableEdit = (param.validate.immutable && this.props.mode == 'edit') || false;
      const getGroup = (children: React.ReactNode) => {
        return (
          <Group
            hasToggleIcon
            description={description}
            title={label}
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
            <Form.Item required={required} disabled={disableEdit} key={param.jsonKey}>
              {children}
            </Form.Item>
          </Group>
        );
      };

      const item = () => {
        switch (param.uiType) {
          case 'Switch':
            const getDefaultSwtichValue = (validate: any) => {
              if (validate.required === true) {
                return false;
              }
            };
            const switchResult = init(param.jsonKey, {
              initValue: initValue || getDefaultSwtichValue(param.validate),
              rules: convertRule(param.validate),
            });
            return (
              <Form.Item
                className="switch-container"
                required={required}
                key={param.jsonKey}
                label={<span title={description}>{label}</span>}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
              >
                <Switch
                  disabled={disableEdit}
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
                label={label}
                key={param.jsonKey}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
              >
                <Input
                  disabled={disableEdit}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: convertRule(param.validate),
                  })}
                />
              </Form.Item>
            );
          case 'Password':
            return (
              <Form.Item
                required={required}
                labelAlign={inline ? 'inset' : 'left'}
                label={label}
                key={param.jsonKey}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
              >
                <Input
                  disabled={disableEdit}
                  htmlType="password"
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: convertRule(param.validate),
                  })}
                />
              </Form.Item>
            );
          case 'Select':
            return (
              <Form.Item
                required={required}
                labelAlign={inline ? 'inset' : 'left'}
                label={label}
                key={param.jsonKey}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
              >
                <Select
                  disabled={disableEdit}
                  locale={locale.Select}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: convertRule(param.validate),
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
                label={label}
                key={param.jsonKey}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
              >
                <Input
                  disabled={disableEdit}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: convertRule(param.validate),
                  })}
                  htmlType="number"
                />
              </Form.Item>
            );
          case 'ImageInput':
            return (
              <Form.Item
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                key={param.jsonKey}
              >
                <ImageInput
                  disabled={disableEdit}
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
                disabled={disableEdit}
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: convertRule(param.validate),
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
                disabled={disableEdit}
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: convertRule(param.validate),
                })}
                key={param.jsonKey}
                additional={param.additional}
                additionalParameter={param.additionalParameter}
              />,
            );
          case 'Strings':
            return getGroup(
              <Strings
                disabled={disableEdit}
                key={param.jsonKey}
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: convertRule(param.validate),
                })}
              />,
            );
          case 'SecretSelect':
            return (
              <Form.Item
                labelAlign={inline ? 'inset' : 'left'}
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
                key={param.jsonKey}
              >
                <SecretSelect
                  disabled={disableEdit}
                  setKeys={(keys: string[]) => {
                    this.setState({ secretKeys: keys });
                  }}
                  {...init(param.jsonKey, {
                    initValue: this.props.value?.name || param.validate.defaultValue,
                    rules: convertRule(param.validate),
                  })}
                />
              </Form.Item>
            );
          case 'SecretKeySelect':
            return (
              <Form.Item
                required={required}
                labelAlign={inline ? 'inset' : 'left'}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
                key={param.jsonKey}
              >
                <SecretKeySelect
                  disabled={disableEdit}
                  secretKeys={this.state.secretKeys}
                  {...init(param.jsonKey, {
                    initValue: this.props.value?.key || param.validate.defaultValue,
                    rules: convertRule(param.validate),
                  })}
                />
              </Form.Item>
            );
          case 'CPUNumber':
            return (
              <Form.Item
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
                key={param.jsonKey}
              >
                <CPUNumber
                  disabled={disableEdit}
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
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
                key={param.jsonKey}
              >
                <MemoryNumber
                  disabled={disableEdit}
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
          case 'DiskNumber':
            return (
              <Form.Item
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
                key={param.jsonKey}
              >
                <DiskNumber
                  disabled={disableEdit}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: [
                      {
                        required: param.validate.required,
                        min: 0,
                        message: 'Please enter a valid disk size',
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
                  description={
                    <div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />
                  }
                  title={label}
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
                    mode={this.props.mode}
                  />
                </Group>
              );
            }
            return <div />;
          case 'Structs':
            if (param.subParameters && param.subParameters.length > 0) {
              return getGroup(
                <Structs
                  key={param.jsonKey}
                  label={label}
                  param={param.subParameters}
                  parameterGroupOption={param.subParameterGroupOption}
                  registerForm={(form: Field) => {
                    this.onRegisterForm(param.jsonKey, form);
                  }}
                  mode={this.props.mode}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: [
                      {
                        validator: validator,
                        message: `Please check ${label} config`,
                      },
                    ],
                  })}
                />,
              );
            }
            return <div />;
          case 'Ignore':
            if (param.subParameters && param.subParameters.length > 0) {
              const itemCount = param.subParameters?.filter((p) => !p.disable).length || 1;
              return (
                <UISchema
                  uiSchema={param.subParameters}
                  registerForm={(form: Field) => {
                    this.onRegisterForm(param.jsonKey, form);
                  }}
                  inline={inline}
                  maxColSpan={24 / itemCount}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: [
                      {
                        validator: validator,
                      },
                    ],
                  })}
                  mode={this.props.mode}
                />
              );
            }
            return <div />;
          case 'K8sObjectsCode':
            return (
              <Form.Item
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
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
      };
      let colSpan = 24;
      if (maxColSpan) {
        colSpan = maxColSpan;
        if (maxColSpan * uiSchema.length < 24) {
        }
      }
      if (param.style?.colSpan) {
        colSpan = param.style?.colSpan;
      }
      return (
        <Col key={param.jsonKey} span={colSpan} style={{ padding: '0 4px' }}>
          {item()}
        </Col>
      );
    });
    const formItemLayout = {
      labelCol: {
        fixedSpan: 10,
      },
      wrapperCol: {
        span: 14,
      },
    };
    return (
      <Form field={this.form} className="ui-schema-container">
        <If condition={disableRenderRow}>{items}</If>
        <If condition={!disableRenderRow}>
          <Row wrap={true}>{items}</Row>
          <If condition={onlyShowRequired}>
            <Divider />
            <Form {...formItemLayout} style={{ width: '100%' }} fullWidth={true}>
              <Form.Item
                labelAlign="left"
                colon={true}
                label={<Translation>Advanced Parameters</Translation>}
                labelWidth="200px"
              >
                <Switch onChange={this.onChangeAdvanced} size="small" checked={advanced} />
              </Form.Item>
            </Form>
          </If>
        </If>
      </Form>
    );
  }
}

export default UISchema;
