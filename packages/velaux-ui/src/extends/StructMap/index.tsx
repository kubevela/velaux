import type { Field } from '@alifd/next';
import React from 'react';

import type { UIParam } from '@velaux/data';
import type { Scope, ExpressionContext } from '../../components/UISchema';
import Structs from '../Structs';

// keyField holds each row's map key while the map is edited as rows.
const keyField = '__key';

type Props = {
  id: string;
  label: string;
  param: UIParam[];
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => void;
  registerForm: (form: Field) => void;
  parentScope?: Scope;
  expressions?: ExpressionContext;
  format?: string;
  mode: 'new' | 'edit';
};

// StructMap edits a map of structs as rows of Structs: a key, then the
// struct's fields. The key is the row key, so two rows cannot share one.
class StructMap extends React.Component<Props> {
  toRows = (value?: Record<string, any>) =>
    value ? Object.keys(value).map((key) => ({ [keyField]: key, ...value[key] })) : undefined;

  toMap = (rows: any[]) => {
    const out: Record<string, any> = {};
    (rows || []).forEach((row) => {
      if (!row || !row[keyField]) {
        return;
      }
      const { [keyField]: key, ...rest } = row;
      out[key] = rest;
    });
    return out;
  };

  render() {
    const { id, label, param, value, onChange, registerForm, parentScope, expressions, format, mode } = this.props;
    const keyParam: UIParam = {
      jsonKey: keyField,
      label: 'Name',
      sort: 0,
      uiType: 'Input',
      validate: { required: true },
    };
    return (
      <Structs
        id={id}
        label={label}
        param={[keyParam, ...param]}
        parameterGroupOption={undefined}
        value={this.toRows(value)}
        onChange={(rows: any[]) => onChange && onChange(this.toMap(rows))}
        registerForm={registerForm}
        parentScope={parentScope}
        expressions={expressions}
        format={format}
        rowKey={keyField}
        mode={mode}
      />
    );
  }
}

export default StructMap;
