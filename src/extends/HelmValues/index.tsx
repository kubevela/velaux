import React, { Component } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _ from 'lodash';
import type { UIParam } from '../../interface/application';
import KV from '../KV';
import { getChartValues } from '../../api/repository';
import { Loading } from '@b-design/ui';

type Props = {
  value?: any;
  onChange: (value: any) => void;
  additional?: boolean;
  additionalParameter?: UIParam;
  subParameters?: UIParam[];
  id: string;
  disabled: boolean;
  helm?: {
    url: string;
    repoType: string;
    chart: string;
    version: string;
  };
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

type State = {
  values?: any;
  helm?: {
    url: string;
    chart: string;
    version: string;
  };
  loading: boolean;
};

class HelmValues extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    this.loadChartValues();
  }

  loadChartValues = () => {
    const { helm } = this.props;
    if (helm?.chart && helm.version && helm.url) {
      getChartValues(helm).then((re) => {
        this.setState({ values: re, helm: helm, loading: false });
      });
    }
  };

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
    const { helm } = this.props;
    const { values, loading, helm: stateHelm } = this.state;
    if (helm != stateHelm) {
      this.loadChartValues();
    }
    return (
      <Loading visible={loading} style={{ width: '100%' }}>
        <KV
          disabled={this.props.disabled}
          onChange={this.onChange}
          value={this.renderValue()}
          keyOptions={values}
          additional={this.props.additional}
          additionalParameter={this.props.additionalParameter}
          subParameters={this.props.subParameters}
          id={this.props.id}
        />
      </Loading>
    );
  }
}

export default HelmValues;
