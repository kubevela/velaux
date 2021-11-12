import React, { Component } from 'react';
import { Form, Input, Select, Field, Balloon } from '@b-design/ui';
import Translation from '../Translation';
import { UIParam, UIParamValidate } from '../../interface/application';
import Group from '../../extends/Group';
import GroupForm from '../GroupForm';
import ImageInput from '../../extends/ImageInput';
import Strings from '../../extends/Strings';
import SecretSelect from '../../extends/SecretSelect';
import SecretKeySelect from '../../extends/SecretKeySelect';
import Structs from '../../extends/Structs';
import CPUNumber from '../../extends/CPUNumber';
import MemoryNumber from '../../extends/MemoryNumber';
import SwitchComponent from '../../extends/Switch';
import InnerGroup from '../../extends/InnerGroup';
import KV from '../../extends/KV';
import './index.less';
type Props = {
  _key?: string;
  inline?: boolean;
  id?: string;
  uiSchema?: Array<UIParam>;
  onChange?: (params: any) => void;
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

class UISchema extends Component<Props> {
  form: Field;
  subParamRef: Map<string, React.RefObject<UISchema>>;
  constructor(props: Props) {
    super(props);
    this.form = new Field(this, {
      onChange: () => {
        this.setValues();
      },
    });
    this.subParamRef = new Map();
  }

  componentDidMount = () => {
    this.setValues();
  };

  setValues = () => {
    const values = this.form.getValues();
    const { onChange } = this.props;
    if (onChange) onChange(values);
  };

  validate = (callback?: (errors: object[] | null, values: any) => void) => {
    this.form.validate(callback);
    // let errors = this.form.getErrors();
    // errors = Object.keys((errors)).reduce((previousValue: any, currentValue) => {
    //   if (errors[currentValue]) {
    //     previousValue[currentValue] = errors[currentValue]
    //   }
    //   return {};
    // }, {})
    // let values = this.form.getValues();
    // if (Object.keys(errors).length > 0) {
    //   callback && callback(errors, values);
    //   return;
    // }
    // const allvalues = this.form.getValues();
    // this.subParamRef.forEach((item, key) => {
    //   item.current?.validate((errors, values) => {
    //     if (errors) {
    //       callback && callback(errors, values);
    //       return;
    //     }
    //     console.log(key, values);
    //   });
    // });
    // callback && callback(null, values);
  };

  render() {
    const { uiSchema, inline } = this.props;
    const init = this.form.init;
    if (!uiSchema) {
      return <div></div>;
    }

    return (
      <Form field={this.form} className="ui-schema-container">
        {uiSchema.map((param) => {
          const required = param.validate && param.validate.required;
          switch (param.uiType) {
            case 'Switch':
              return (
                <Form.Item
                  className="switch-container"
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
                  ></Input>
                </Form.Item>
              );
            case 'Select':
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
                  <GroupForm
                    uiSchema={param.subParameters}
                    {...init(param.jsonKey, {
                      initValue: param.validate.defaultValue,
                      rules: converRule(param.validate),
                    })}
                  />
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
                const ref = React.createRef<UISchema>();
                this.subParamRef.set(param.jsonKey, ref);
                return (
                  <Group
                    hasToggleIcon
                    description={<Translation>{param.description || ''}</Translation>}
                    title={<Translation>{param.label || ''}</Translation>}
                    closed={true}
                  >
                    <GroupForm
                      _key={param.jsonKey}
                      uiSchema={param.subParameters}
                      {...init(param.jsonKey, {
                        initValue: param.validate.defaultValue,
                        rules: converRule(param.validate),
                      })}
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
                return (
                  <Group
                    hasToggleIcon
                    description={<Translation>{param.description || ''}</Translation>}
                    title={<Translation>{param.label || ''}</Translation>}
                    closed={true}
                  >
                    <Structs
                      _key={param.jsonKey}
                      param={param.subParameters}
                      parameterGroupOption={param.subParameterGroupOption}
                      {...init(param.jsonKey, {
                        initValue: param.validate.defaultValue,
                        rules: converRule(param.validate),
                      })}
                    />
                  </Group>
                );
              }
              return <div></div>;
            case 'Ignore':
              if (param.subParameters && param.subParameters.length > 0) {
                // const ref = React.createRef<UISchema>();
                // this.subParamRef.set(param.jsonKey, ref);
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
        })}
      </Form>
    );
  }
}

export default UISchema;
