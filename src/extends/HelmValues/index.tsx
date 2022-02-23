import React, { Component } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _ from 'lodash';
import type { UIParam } from '../../interface/application';
import KV from '../KV';

type Props = {
  value?: any;
  onChange: (value: any) => void;
  additional?: boolean;
  additionalParameter?: UIParam;
  subParameters?: UIParam[];
  id: string;
  disabled: boolean;
};

function setValues(target: any, value: any, key: string, keys: string[]) {
  if (!keys || keys.length == 0) {
    target[key] = value;
    return target;
  }
  if (target[key]) {
    target[key] = setValues(target[key], value, keys[0], keys.slice(1));
    return target;
  }
  target[key] = setValues({}, value, keys[0], keys.slice(1));
  return target;
}

function getValues(target: any, key: string, newValues: any) {
  if (!target) {
    newValues[key] = target;
    return;
  }

  if (typeof target === 'object') {
    const keys = Object.keys(target);
    keys.map((subkey: string) => {
      getValues(target[subkey], key ? key + '.' + subkey : subkey, newValues);
    });
  } else {
    newValues[key] = target;
  }
}

class HelmValues extends Component<Props> {
  componentDidMount() {}

  onChange = (values: any) => {
    let helmValues: any = {};
    if (values) {
      Object.keys(values).map((key: string) => {
        const keys = key.split('.');
        helmValues = setValues(helmValues, values[key], keys[0], keys.slice(1));
      });
    }
    this.props.onChange(helmValues);
  };

  renderValue = () => {
    const newValues: any = {};
    getValues(this.props.value, '', newValues);
    return newValues;
  };

  render() {
    return (
      <KV
        disabled={this.props.disabled}
        onChange={this.onChange}
        value={this.renderValue()}
        additional={this.props.additional}
        additionalParameter={this.props.additionalParameter}
        subParameters={this.props.subParameters}
        id={this.props.id}
      />
    );
  }
}

export default HelmValues;
