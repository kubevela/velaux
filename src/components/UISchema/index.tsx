import React from 'react';
import Translation from '../Translation';
import { UIParam, UIParamValidate } from '../../interface/applicationplan';
import Group from '../../extends/Group';
import { Form, Input, Select, Field } from '@b-design/ui';

type Props = {
  field: Field;
  title?: string;
  description?: string;
  uiSchema?: Array<UIParam>;
  className?: string | undefined;
  loading: boolean;
  closed?: boolean;
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

const UISchema = (props: Props) => {
  const init = props.field.init;
  return (
    <Group
      hasToggleIcon
      description={<Translation>{props.description || ''}</Translation>}
      title={<Translation>{props.title || ''}</Translation>}
      loading={props.loading}
      closed={props.closed}
    >
      {props.uiSchema &&
        props.uiSchema.map((param) => {
          if (param.subParameters && param.subParameters.length > 0) {
            return (
              <UISchema
                closed={true}
                title={param.label}
                description={param.description}
                field={props.field}
                uiSchema={param.subParameters}
                loading={props.loading}
              ></UISchema>
            );
          }
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
                  <Select dataSource={param.validate && param.validate.options}></Select>
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
                  <Input htmlType="number"></Input>
                </Form.Item>
              );
            case 'Group':
          }
        })}
    </Group>
  );
};

export default UISchema;
