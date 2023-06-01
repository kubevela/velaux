import React, { Component } from 'react';

import { Translation } from '../Translation';
import type { ParamCondition, UIParam, UIParamValidate , Definition } from '@velaux/data';

import type { Rule } from '@alifd/field';
import { Form, Input, Select, Field, Switch, Grid, Divider } from '@alifd/next';

import './index.less';
import i18n from 'i18next';
import * as yaml from 'js-yaml';
import { v4 as uuid } from 'uuid';

import CPUNumber from '../../extends/CPUNumber';
import CertBase64 from '../../extends/CertBase64';
import ComponentPatches from '../../extends/ComponentPatches';
import ComponentSelect from '../../extends/ComponentSelect';
import DiskNumber from '../../extends/DiskNumber';
import Group from '../../extends/Group';
import HelmChartSelect from '../../extends/HelmChartSelect';
import HelmChartVersionSelect from '../../extends/HelmChartVersionSelect';
import HelmRepoSelect from '../../extends/HelmRepoSelect';
import HelmValues from '../../extends/HelmValues';
import ImageInput from '../../extends/ImageInput';
import K8sObjectsCode from '../../extends/K8sObjectsCode';
import KV from '../../extends/KV';
import MemoryNumber from '../../extends/MemoryNumber';
import PolicySelect from '../../extends/PolicySelect';
import SecretKeySelect from '../../extends/SecretKeySelect';
import SecretSelect from '../../extends/SecretSelect';
import Strings from '../../extends/Strings';
import Numbers from '../../extends/Numbers';
import Structs from '../../extends/Structs';
import { checkImageName, replaceUrl } from '../../utils/common';
import { locale } from '../../utils/locale';
import { getValue } from '../../utils/utils';
import DefinitionCode from '../DefinitionCode';
import { If } from '../If';

const { Col, Row } = Grid;

type Props = {
  inline?: boolean;
  id?: string;
  value?: any;
  enableCodeEdit?: boolean;
  uiSchema?: UIParam[];
  maxColSpan?: number;
  onChange?: (params: any) => void;
  registerForm?: (form: Field) => void;
  disableRenderRow?: boolean;
  mode: 'new' | 'edit';
  advanced?: boolean;
  definition?: Definition;
};

function convertRule(validate?: UIParamValidate) {
  const rules: Rule[] = [];
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
  codeError?: string;
};

class UISchema extends Component<Props, State> {
  form: Field;
  registerForm: Record<string, Field>;
  constructor(props: Props) {
    super(props);
    const paramKeyMap: Record<string, UIParam> = {};
    this.props.uiSchema?.map((param) => {
      paramKeyMap[param.jsonKey] = param;
    });
    this.form = new Field(this, {
      onChange: (name: string, value: any) => {
        const values: any = this.form.getValues();
        // Can not assign the empty value for the field with the number type
        if (paramKeyMap[name] && paramKeyMap[name].uiType == 'Number' && value === '') {
          delete values[name];
        }
        // Can not assign the empty value for the field with the array type
        if (Array.isArray(value) && value.length == 0) {
          delete values[name];
        }
        const { onChange } = this.props;
        if (onChange) {
          onChange(values);
        }
      },
    });
    this.registerForm = {};
    if (this.props.registerForm) {
      this.props.registerForm(this.form);
    }
    this.state = {
      secretKeys: [],
      advanced: props.advanced || false,
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

  // The upper component must set the values before init the UI Schema component.
  setValues = () => {
    const { value } = this.props;
    if (value) {
      this.form.setValues(value);
    }
  };

  validate = (callback: (error?: string) => void) => {
    this.form.validate((errors) => {
      const { codeError } = this.state;
      if (errors) {
        console.log(errors);
        callback('ui schema validate failure');
        return;
      }
      if (codeError) {
        callback('ui schema validate failure');
        return;
      }
      callback();
    });
  };

  conditionAllowRender = (conditions?: ParamCondition[]) => {
    if (!conditions || conditions.length == 0) {
      return true;
    }
    const action = {
      disable: 0,
      enable: 0,
    };
    let enableConditionCount = 0;
    conditions.map((condition) => {
      const values = this.form.getValues();
      const value = getValue(condition.jsonKey, values);
      // the enable conditions count
      if (condition.action == 'enable' || !condition.action) {
        enableConditionCount += 1;
      }
      if (value == undefined) {
        return;
      }
      switch (condition.op) {
        case 'in':
          if (Array.isArray(condition.value) && condition.value.includes(value)) {
            action[condition.action || 'enable'] += 1;
          }
          break;
        case '!=':
          if (condition.value != value) {
            action[condition.action || 'enable'] += 1;
          }
          break;
        default:
          if (condition.value == value) {
            action[condition.action || 'enable'] += 1;
          }
      }
    });
    if (action.disable > 0) {
      return false;
    }
    if (action.enable > 0 && action.enable == enableConditionCount) {
      return true;
    }
    // all condition can not matching or not all enable conditions are matched
    return false;
  };

  renderDocumentURL = () => {
    const { definition } = this.props;
    if (definition) {
      switch (definition.type) {
        case 'component':
          return 'https://kubevela.net/docs/end-user/components/references#' + definition.name;
        case 'trait':
          return 'https://kubevela.net/docs/end-user/traits/references#' + definition.name;
        case 'policy':
          return 'https://kubevela.net/docs/end-user/policies/references#' + definition.name;
        case 'workflowstep':
          return 'https://kubevela.net/docs/end-user/workflow/built-in-workflow-defs#' + definition.name;
      }
    }
    return;
  };

  renderCodeEdit = () => {
    const { value, onChange, definition } = this.props;
    const { codeError } = this.state;
    const codeID = uuid();
    let yamlValue = yaml.dump(value);
    if (yamlValue == '{}\n') {
      yamlValue = '';
    }
    return (
      <div style={{ width: '100%' }}>
        <If condition={codeError}>
          <span style={{ color: 'red' }}>{codeError}</span>
        </If>
        <If condition={definition}>
          <p>
            Refer to the document:
            <a style={{ marginLeft: '8px' }} target="_blank" href={this.renderDocumentURL()} rel="noopener noreferrer">
              click here
            </a>
          </p>
        </If>
        <div id={codeID} className="guide-code">
          <DefinitionCode
            value={yamlValue}
            onBlurEditor={(v) => {
              if (onChange) {
                try {
                  const valueObj = yaml.load(v);
                  onChange(valueObj);
                  this.setState({ codeError: '' });
                } catch (err) {
                  this.setState({ codeError: 'Please input a valid yaml config:' + err });
                }
              }
            }}
            id={codeID + '-code'}
            containerId={codeID}
            language={'yaml'}
            readOnly={false}
          />
        </div>
      </div>
    );
  };

  render() {
    const { advanced } = this.state;
    const { uiSchema, inline, maxColSpan, disableRenderRow, value, mode, enableCodeEdit } = this.props;
    if (!uiSchema || enableCodeEdit) {
      return this.renderCodeEdit();
    }
    let onlyShowRequired = false;
    let couldShowParamCount = 0;
    uiSchema.map((param) => {
      if (param.disable) {
        return;
      }
      // Determine whether to continue rendering according to conditions.
      if (!this.conditionAllowRender(param.conditions)) {
        return;
      }
      couldShowParamCount += 1;
    });

    // if the param's count is small, not hide the params
    if (couldShowParamCount > 5) {
      onlyShowRequired = true;
    }

    let couldBeDisabledParamCount = 0;
    let requiredParamCount = 0;
    const items = uiSchema.map((param) => {
      const init = this.form.init;
      const required = param.validate && param.validate.required;
      if (param.disable) {
        return;
      }
      // Determine whether to continue rendering according to conditions.
      if (!this.conditionAllowRender(param.conditions)) {
        return;
      }

      if (!required) {
        couldBeDisabledParamCount += 1;
      } else {
        requiredParamCount += 1;
      }

      if (onlyShowRequired && !required && !advanced) {
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
        } else if (required) {
          callback(`param ${param.jsonKey} is required`);
        } else {
          callback();
        }
      };

      let description = param.description;
      if (description && description.indexOf('http') == -1 && description.indexOf(':') == -1) {
        description = i18n.t(description);
      }
      let label = param.label;
      if (label) {
        label = i18n.t(label);
      }
      let initValue = value && value[param.jsonKey];
      if (initValue === undefined) {
        initValue = param.validate?.defaultValue;
      }
      const disableEdit = (param.validate?.immutable && mode == 'edit') || false;
      const getGroup = (children?: React.ReactNode) => {
        return (
          <Group
            hasToggleIcon
            description={description}
            title={label}
            closed={true}
            required={required}
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
              <>{children}</>
            </Form.Item>
          </Group>
        );
      };

      const item = () => {
        switch (param.uiType) {
          case 'Switch':
            const getDefaultSwitchValue = (validate: any) => {
              if (validate.required === true) {
                return false;
              }
              return;
            };
            const switchResult = init(param.jsonKey, {
              initValue: initValue || getDefaultSwitchValue(param.validate),
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
                  autoComplete="off"
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
                  autoComplete="off"
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
                  locale={locale().Select}
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
            const imagePullSecretsValue = value && value.imagePullSecrets;
            const initResult = init('imagePullSecrets', {
              initValue: imagePullSecretsValue,
              rules: [],
            });
            return (
              <ImageInput
                label={label}
                key={param.jsonKey}
                required={required || false}
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
                secretValue={initResult.value}
                onSecretChange={initResult.onChange}
                secretID={initResult.id}
              />
            );
          case 'HelmChartSelect':
            return (
              <Form.Item
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                key={param.jsonKey}
              >
                <HelmChartSelect
                  disabled={disableEdit}
                  helm={this.props.value}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: [
                      {
                        required: true,
                        pattern: checkImageName,
                        message: 'Please select a chart',
                      },
                    ],
                  })}
                />
              </Form.Item>
            );
          case 'HelmChartVersionSelect':
            return (
              <Form.Item
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                key={param.jsonKey}
              >
                <HelmChartVersionSelect
                  disabled={disableEdit}
                  helm={this.props.value}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: [
                      {
                        required: true,
                        pattern: checkImageName,
                        message: 'Please select a chart version',
                      },
                    ],
                  })}
                />
              </Form.Item>
            );
          case 'HelmRepoSelect':
            return (
              <Form.Item
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                key={param.jsonKey}
              >
                <HelmRepoSelect
                  disabled={disableEdit}
                  helm={this.props.value}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: [
                      {
                        required: true,
                        pattern: checkImageName,
                        message: 'Please select or input a helm repo',
                      },
                    ],
                  })}
                  onChangeSecretRef={(secretName: string) => {
                    this.form.setValue('secretRef', secretName);
                  }}
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
                helm={this.props.value}
                additional={param.additional}
                additionalParameter={param.additionalParameter}
              />
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
              />
            );
          case 'Numbers':
            return getGroup(
              <Numbers
                disabled={disableEdit}
                key={param.jsonKey}
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: convertRule(param.validate),
                })}
              />
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
                    initValue: this.props.value?.name || param.validate?.defaultValue,
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
                    initValue: this.props.value?.key || param.validate?.defaultValue,
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
                        required: required,
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
                        required: required,
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
                        required: required,
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
                  description={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                  title={label}
                  closed={true}
                  required={required}
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
                />
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
                        required: required,
                        message: 'Please enter a valid kubernetes resource yaml code',
                      },
                    ],
                  })}
                />
              </Form.Item>
            );
          case 'PolicySelect':
            return (
              <Form.Item
                labelAlign={inline ? 'inset' : 'left'}
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
                key={param.jsonKey}
              >
                <PolicySelect
                  disabled={disableEdit}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: convertRule(param.validate),
                  })}
                />
              </Form.Item>
            );
          case 'ComponentSelect':
            return (
              <Form.Item
                labelAlign={inline ? 'inset' : 'left'}
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
                key={param.jsonKey}
              >
                <ComponentSelect
                  disabled={disableEdit}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: convertRule(param.validate),
                  })}
                />
              </Form.Item>
            );
          case 'ComponentPatches':
            return (
              <Form.Item
                labelAlign={inline ? 'inset' : 'left'}
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
                key={param.jsonKey}
              >
                <ComponentPatches
                  disabled={disableEdit}
                  registerForm={(form: Field) => {
                    this.onRegisterForm(param.jsonKey, form);
                  }}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: [
                      {
                        validator: validator,
                      },
                    ],
                  })}
                />
              </Form.Item>
            );
          case 'CertBase64':
            return (
              <Form.Item
                labelAlign={inline ? 'inset' : 'left'}
                required={required}
                label={label}
                help={<div dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }} />}
                disabled={disableEdit}
                key={param.jsonKey}
              >
                <CertBase64
                  disabled={disableEdit}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: convertRule(param.validate),
                  })}
                />
              </Form.Item>
            );
          default:
            return;
        }
      };
      let colSpan = 24;
      if (maxColSpan) {
        colSpan = maxColSpan;
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
        fixedSpan: 4,
      },
      wrapperCol: {
        span: 14,
      },
    };

    const showAdvancedButton = couldBeDisabledParamCount != couldShowParamCount || requiredParamCount === 0;
    return (
      <Form field={this.form} className="ui-schema-container">
        <If condition={disableRenderRow}>{items}</If>
        <If condition={!disableRenderRow}>
          <Row wrap={true}>{items}</Row>
          <If condition={onlyShowRequired}>
            <Divider />
            <If condition={showAdvancedButton}>
              <Form {...formItemLayout} style={{ width: '100%' }} fullWidth={true}>
                <Form.Item labelAlign="left" colon={true} label={<Translation>Advanced Parameters</Translation>}>
                  <Switch onChange={this.onChangeAdvanced} size="small" checked={advanced} />
                </Form.Item>
              </Form>
            </If>
          </If>
        </If>
      </Form>
    );
  }
}

export default UISchema;
