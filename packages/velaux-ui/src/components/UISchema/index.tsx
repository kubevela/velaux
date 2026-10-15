import React, { Component } from 'react';

import { Translation } from '../Translation';
import type { ParamCondition, UIParam, UIParamValidate, Definition } from '@velaux/data';

import type { Rule } from '@alifd/field';
import { Balloon, Form, Input, Select, Field, Switch, Grid, Divider, Collapse } from '@alifd/next';
import { AiOutlineLock } from 'react-icons/ai';

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
import StructMap from '../../extends/StructMap';
import ExpressionEditor from '../../extends/ExpressionEditor';
import type { ExpressionEnv } from '../../extends/ExpressionEditor';
import OptionsFromSelect, { isOptionsSource } from '../../extends/OptionsFromSelect';
import { checkImageName, replaceUrl } from '../../utils/common';
import { locale } from '../../utils/locale';
import { getValue } from '../../utils/utils';
import { immutableLocked } from '../../utils/immutable';
import DefinitionCode from '../DefinitionCode';
import { If } from '../If';

const { Col, Row } = Grid;

// ExpressionContext says where a form's values are written, so its fields can
// take $( ) expressions: the application, and the surface (component, trait,
// workflowstep or source) that decides what an expression can read.
export type ExpressionContext = {
  appName: string;
  surface: string;
  // source names the source being edited, on the source surface: it reads only
  // the sources declared before it.
  source?: string;
  // draft is an application being created, which the expression endpoints of
  // an existing one cannot answer for.
  draft?: boolean;
  env?: ExpressionEnv;
  // onOptIn turns the application's reading of expressions on or off,
  // resolving true once it has.
  onOptIn: (on: boolean) => Promise<boolean>;
};

// expressibleTypes are the widgets whose value an expression may replace.
const expressibleTypes = ['Input', 'Number', 'Switch', 'Select', 'Suggest'];

// Scope is an enclosing form, which a condition reaches with `../`.
export type Scope = {
  getValues: () => any;
  parent?: Scope;
};

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
  // deployed says the application has been deployed. Until it has, KubeVela
  // lets any parameter change, so none is locked; left unset, the form assumes
  // it has.
  deployed?: boolean;
  parentScope?: Scope;
  expressions?: ExpressionContext;
};

// toJSRegExp compiles a CUE (RE2) pattern for the browser. A leading inline
// flag group such as (?i) becomes a JavaScript flag; a pattern JavaScript
// still cannot compile is not checked here, since the controller checks every
// value against the definition anyway.
export function toJSRegExp(pattern: string): RegExp | undefined {
  let source = pattern;
  let flags = '';
  const inline = /^\(\?([ims]+)\)/.exec(source);
  if (inline) {
    flags = Array.from(new Set(inline[1].split(''))).join('');
    source = source.substring(inline[0].length);
  }
  // RE2 spellings with a JavaScript equivalent: \A and \z anchor the whole
  // text (JavaScript would read them as the letters), (?P<name> names a group.
  source = source
    .replace(/(^|[^\\])\\A/g, '$1^')
    .replace(/(^|[^\\])\\z/g, '$1$$')
    .replace(/\(\?P</g, '(?<');
  try {
    return new RegExp(source, flags);
  } catch (e) {
    return undefined;
  }
}

// expressionKind is the type a param's value must have, for checking an
// expression written in its place.
function expressionKind(param: UIParam): string {
  switch (param.uiType) {
    case 'Number':
      return 'number';
    case 'Switch':
      return 'boolean';
    case 'Select':
      return typeof param.validate?.options?.[0]?.value === 'number' ? 'number' : 'string';
  }
  return 'string';
}

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
      message: validate.message || 'Enter a number greater than ' + validate.min,
    });
  }
  if (validate.max != undefined) {
    rules.push({
      max: validate.max,
      message: validate.message || 'Enter a number less than ' + validate.max,
    });
  }
  if (validate.minLength != undefined) {
    rules.push({
      minLength: validate.minLength,
      message: validate.message || `Enter a minimum of ${validate.minLength} characters.`,
    });
  }
  if (validate.maxLength != undefined) {
    rules.push({
      maxLength: validate.maxLength,
      message: validate.message || `Enter a maximum of ${validate.maxLength} characters.`,
    });
  }
  const pattern = validate.pattern && toJSRegExp(validate.pattern);
  if (pattern) {
    rules.push({
      pattern: pattern,
      message: validate.message || `Please enter a value that conforms to the specification. ` + validate.pattern,
    });
  }
  return rules;
}

type State = {
  secretKeys?: string[];
  advanced: boolean;
  codeError?: string;
  // expressionKeys records the params switched to or from an expression;
  // others start in expression mode when their value holds one.
  expressionKeys: Record<string, boolean>;
};

class UISchema extends Component<Props, State> {
  form: Field;
  registerForm: Record<string, Field>;
  // stored holds the values the form opened with. KubeVela locks an immutable
  // parameter only once a value has been deployed, so one that was never set
  // can still be filled in.
  stored: any;
  constructor(props: Props) {
    super(props);
    this.stored = props.value;
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
      expressionKeys: {},
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

  // expressible reports whether a param offers the ƒx toggle: a scalar widget,
  // in an application reading expressions, that the definition does not keep
  // literal.
  expressible = (param: UIParam) =>
    !!this.props.expressions?.env?.enabled &&
    !!this.props.expressions?.env?.optedIn &&
    param.style?.expression !== 'never' &&
    expressibleTypes.includes(param.uiType);

  // openedAsExpression records the params that opened holding an expression.
  // They stay in expression mode while it is edited, since the value passes
  // through text with no $( in it, until the toggle switches them back.
  openedAsExpression: Record<string, boolean> = {};

  inExpressionMode = (param: UIParam, initValue: any): boolean => {
    const chosen = this.state.expressionKeys[param.jsonKey];
    if (chosen !== undefined) {
      return chosen;
    }
    if (this.openedAsExpression[param.jsonKey]) {
      return true;
    }
    const current = this.form.getValue(param.jsonKey);
    const v = current === undefined ? initValue : current;
    const held = typeof v === 'string' && v.indexOf('$(') > -1 && param.style?.expression !== 'never';
    if (held) {
      this.openedAsExpression[param.jsonKey] = true;
    }
    return held;
  };

  setExpressionMode = (param: UIParam, on: boolean) => {
    const v = this.form.getValue(param.jsonKey);
    if (on && v !== undefined && v !== null && v !== '' && typeof v !== 'string') {
      // A number or bool keeps its type as a whole expression.
      this.form.setValue(param.jsonKey, `$(${JSON.stringify(v)})`);
    }
    if (!on && typeof v === 'string' && v.indexOf('$(') > -1) {
      this.form.setValue(param.jsonKey, undefined);
    }
    this.setState({ expressionKeys: { ...this.state.expressionKeys, [param.jsonKey]: on } }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.form.getValues());
      }
    });
  };

  toggleExpression = (param: UIParam, active: boolean) => {
    this.setExpressionMode(param, !active);
  };

  // expressionsToggle is the switch that lets the application read $( )
  // expressions, shown once, at the top of the outermost form.
  expressionsToggle = () => {
    const { expressions, parentScope } = this.props;
    if (!expressions?.env?.enabled || parentScope) {
      return null;
    }
    const on = !!expressions.env.optedIn;
    const held = !on && JSON.stringify(this.form.getValues() || {}).indexOf('$(') > -1;
    return (
      <div className="ui-schema-expressions-toggle">
        <span title="Let this application read $( ) CEL expressions in its properties, from its next deploy">
          Expressions
        </span>
        <Switch size="small" checked={on} onChange={(checked: boolean) => expressions.onOptIn(checked)} />
        {held && <div className="ui-schema-expressions-note">Expressions here will be read as plain text.</div>}
      </div>
    );
  };

  // conditionValue reads the field a condition names: in this form, in a
  // child object (`storage.kind`), or in an enclosing form (`../mode`).
  conditionValue = (jsonKey: string) => {
    let key = jsonKey;
    let scope: Scope | undefined = this.scope();
    while (key.startsWith('../')) {
      key = key.substring(3);
      scope = scope?.parent;
    }
    return scope ? getValue(key, scope.getValues()) : undefined;
  };

  scope = (): Scope => ({ getValues: () => this.form.getValues(), parent: this.props.parentScope });

  // inSections gathers the rendered params of each named section into one
  // collapsible panel, placed where the section's first param is.
  inSections = (uiSchema: UIParam[], items: Array<React.ReactElement | undefined>) => {
    const sections: Record<string, React.ReactElement[]> = {};
    uiSchema.forEach((param, i) => {
      const section = param.style?.section;
      if (section && items[i]) {
        (sections[section] = sections[section] || []).push(items[i] as React.ReactElement);
      }
    });
    const out: React.ReactNode[] = [];
    const placed = new Set<string>();
    uiSchema.forEach((param, i) => {
      const section = param.style?.section;
      if (!items[i]) {
        return;
      }
      if (!section) {
        out.push(items[i]);
        return;
      }
      if (placed.has(section)) {
        return;
      }
      placed.add(section);
      out.push(
        <Col key={`section-${section}`} span={24} style={{ padding: '0 4px', marginBottom: '16px' }}>
          <Collapse defaultExpandedKeys={[section]}>
            <Collapse.Panel key={section} title={section}>
              <Row wrap={true}>{sections[section]}</Row>
            </Collapse.Panel>
          </Collapse>
        </Col>
      );
    });
    return out;
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
      const value = this.conditionValue(condition.jsonKey);
      // the enable conditions count
      if (condition.action == 'enable' || !condition.action) {
        enableConditionCount += 1;
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
    // A schema that marks its advanced params hides exactly those.
    const explicitAdvanced = uiSchema.some((param) => param.style?.advanced);

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

      if (explicitAdvanced ? param.style?.advanced && !advanced : onlyShowRequired && !required && !advanced) {
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
      const disableEdit = immutableLocked(param, mode, this.props.deployed, this.stored);
      // An immutable field is disabled when editing, as KubeVela refuses to change
      // it once deployed; a lock beside its label says so on hover.
      const fieldLabel: React.ReactNode = disableEdit ? (
        <span className="ui-schema-locked-label">
          {label}
          <Balloon.Tooltip trigger={<AiOutlineLock className="ui-schema-lock" />} align="t">
            {i18n.t('Cannot be changed once deployed')}
          </Balloon.Tooltip>
        </span>
      ) : (
        label
      );
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
        if (isOptionsSource(param.style?.optionsFrom)) {
          return (
            <Form.Item
              required={required}
              labelAlign={inline ? 'inset' : 'left'}
              label={label}
              key={param.jsonKey}
              extra={
                <div
                  className="ui-schema-description"
                  dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                />
              }
            >
              <OptionsFromSelect
                source={param.style?.optionsFrom || ''}
                disabled={disableEdit}
                placeholder={param.style?.placeholder}
                {...init(param.jsonKey, {
                  initValue: initValue,
                  rules: convertRule(param.validate),
                })}
              />
            </Form.Item>
          );
        }
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
                label={<span title={description}>{fieldLabel}</span>}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                key={param.jsonKey}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
              >
                <Input
                  disabled={disableEdit}
                  autoComplete="off"
                  placeholder={param.style?.placeholder}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: convertRule(param.validate),
                  })}
                />
              </Form.Item>
            );
          case 'Suggest':
            return (
              <Form.Item
                required={required}
                labelAlign={inline ? 'inset' : 'left'}
                label={label}
                key={param.jsonKey}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
              >
                <Select.AutoComplete
                  disabled={disableEdit}
                  hasClear
                  style={{ width: '100%' }}
                  locale={locale().Select}
                  placeholder={param.style?.placeholder}
                  dataSource={(param.validate?.options || []).map((o) => ({ label: o.label, value: o.value }))}
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
                label={fieldLabel}
                key={param.jsonKey}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                key={param.jsonKey}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                key={param.jsonKey}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                  emptyValue={{}}
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
                    parentScope={this.scope()}
                    expressions={this.props.expressions}
                    mode={this.props.mode}
                    deployed={this.props.deployed}
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
                  parentScope={this.scope()}
                  expressions={this.props.expressions}
                  format={param.style?.format}
                  rowKey={param.style?.rowKey}
                  itemLabel={param.style?.itemLabel}
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
          case 'StructMap':
            if (param.subParameters && param.subParameters.length > 0) {
              return getGroup(
                <StructMap
                  key={param.jsonKey}
                  label={label}
                  param={param.subParameters}
                  parentScope={this.scope()}
                  expressions={this.props.expressions}
                  format={param.style?.format}
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
                  parentScope={this.scope()}
                  expressions={this.props.expressions}
                  {...init(param.jsonKey, {
                    initValue: initValue,
                    rules: [
                      {
                        validator: validator,
                      },
                    ],
                  })}
                  deployed={this.props.deployed}
                  mode={this.props.mode}
                />
              );
            }
            return <div />;
          case 'K8sObjectsCode':
            return (
              <Form.Item
                required={required}
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
                label={fieldLabel}
                extra={
                  <div
                    className="ui-schema-description"
                    dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
                  />
                }
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
      const expressible = this.expressible(param);
      const inExpression = this.inExpressionMode(param, initValue);
      const expressionItem = () => (
        <Form.Item
          required={required}
          labelAlign={inline ? 'inset' : 'left'}
          label={label}
          key={param.jsonKey}
          extra={
            <div
              className="ui-schema-description"
              dangerouslySetInnerHTML={{ __html: replaceUrl(description || '') }}
            />
          }
        >
          <ExpressionEditor
            appName={this.props.expressions?.appName || ''}
            surface={this.props.expressions?.surface || ''}
            source={this.props.expressions?.source}
            draft={this.props.expressions?.draft}
            env={this.props.expressions?.env}
            kind={expressionKind(param)}
            disabled={disableEdit}
            {...init(param.jsonKey, {
              initValue: initValue,
              rules: required ? [{ required: true, message: 'This field is required.' }] : [],
            })}
          />
        </Form.Item>
      );
      return (
        <Col
          key={param.jsonKey}
          span={colSpan}
          style={{ padding: '0 4px' }}
          className={expressible ? 'ui-schema-expressible' : undefined}
        >
          {expressible && (
            <span
              className={`ui-schema-fx${inExpression ? ' active' : ''}`}
              title={inExpression ? 'Write a value instead' : 'Write a $( ) expression'}
              onClick={() => this.toggleExpression(param, inExpression)}
            >
              ƒx
            </span>
          )}
          {inExpression ? expressionItem() : item()}
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

    const showAdvancedButton =
      explicitAdvanced || couldBeDisabledParamCount != couldShowParamCount || requiredParamCount === 0;
    return (
      <Form field={this.form} className="ui-schema-container">
        <If condition={disableRenderRow}>{items}</If>
        <If condition={!disableRenderRow}>
          {this.expressionsToggle()}
          <Row wrap={true}>{this.inSections(uiSchema, items)}</Row>
          <If condition={onlyShowRequired || explicitAdvanced}>
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
