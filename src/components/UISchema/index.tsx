import React, { Component } from 'react';
import Translation from '../Translation';
import { UIParam, UIParamValidate } from '../../interface/applicationplan';
import Group from '../../extends/Group';
import { Form, Input, Select, Field } from '@b-design/ui';
import { ValidateResults } from '@alifd/field';
import ImageInput from '../../extends/ImageInput';
import Strings from '../../extends/Strings';
import SecretSelect from '../../extends/SecretSelect';
import SecretKeySelect from '../../extends/SecretKeySelect';
import Structs from '../../extends/Structs';
import CPUNumber from '../../extends/CPUNumber';
import MemoryNumber from '../../extends/MemoryNumber';

type Props = {
  uiSchema?: Array<UIParam>;
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
    this.form = new Field(this);
    this.subParamRef = new Map();
  }
  validate = (callback?: (errors: object[], values: any) => void) => {
    this.form.validate();
    if (this.form.getErrors()) {
      callback && callback(this.form.getErrors(), this.form.getValues());
      return;
    }
    const allvalues = this.form.getValues();
    this.subParamRef.forEach((item, key) => {
      item.current?.validate((errors, values) => {
        if (errors) {
          callback && callback(errors, values);
          return;
        }
        console.log(key, values);
      });
    });
    callback && callback(this.form.getErrors(), allvalues);
  };
  render() {
    const { uiSchema } = this.props;
    const init = this.form.init;
    if (!uiSchema) {
      return <div></div>;
    }
    return (
      <div>
        {uiSchema.map((param) => {
          const required = param.validate && param.validate.required;
          switch (param.uiType) {
            case 'Input':
              return (
                <Form.Item
                  required={required}
                  label={param.label}
                  help={param.description}
                  disabled={param.disable}
                >
                  <Input
                    {...init(param.jsonKey, {
                      rules: converRule(param.validate),
                    })}
                  ></Input>
                </Form.Item>
              );
            case 'Select':
              return (
                <Form.Item
                  required={required}
                  label={param.label}
                  help={param.description}
                  disabled={param.disable}
                >
                  <Select
                    {...init(param.jsonKey, {
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
                  help={param.description}
                  disabled={param.disable}
                >
                  <Input
                    {...init(param.jsonKey, {
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
                  <ImageInput></ImageInput>
                </Form.Item>
              );
            case 'Strings':
              return (
                <Form.Item
                  required={required}
                  label={param.label}
                  help={param.description}
                  disabled={param.disable}
                >
                  <Strings></Strings>
                </Form.Item>
              );
            case 'SecretSelect':
              return (
                <Form.Item
                  required={required}
                  label={param.label}
                  help={param.description}
                  disabled={param.disable}
                >
                  <SecretSelect></SecretSelect>
                </Form.Item>
              );
            case 'SecretKeySelect':
              return (
                <Form.Item
                  required={required}
                  label={param.label}
                  help={param.description}
                  disabled={param.disable}
                >
                  <SecretKeySelect></SecretKeySelect>
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
                    <UISchema
                      key={param.jsonKey}
                      uiSchema={param.subParameters}
                      ref={ref}
                    ></UISchema>
                  </Group>
                );
              }
              return <div></div>;
            case 'Structs':
              if (param.subParameters && param.subParameters.length > 0) {
                const ref = React.createRef<Structs>();
                return <Structs key={param.jsonKey} param={param} ref={ref}></Structs>;
              }
              return <div></div>;
            case 'Ignore':
              if (param.subParameters && param.subParameters.length > 0) {
                const ref = React.createRef<UISchema>();
                this.subParamRef.set(param.jsonKey, ref);
                return (
                  <UISchema key={param.jsonKey} uiSchema={param.subParameters} ref={ref}></UISchema>
                );
              }
              return <div></div>;
            case 'CPUNumber':
              return (
                <Form.Item
                  required={required}
                  label={param.label}
                  help={param.description}
                  disabled={param.disable}
                >
                  <CPUNumber></CPUNumber>
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
                  <MemoryNumber></MemoryNumber>
                </Form.Item>
              );
          }
        })}
      </div>
    );
  }
}

export default UISchema;
