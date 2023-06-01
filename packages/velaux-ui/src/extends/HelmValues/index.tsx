import { Button, Loading } from '@alifd/next';
import { connect } from 'dva';
import YAML from 'js-yaml';
import _ from 'lodash';
import React, { Component } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getChartValueFiles } from '../../api/repository';
import HelmValueShow from '../../components/HelmValueShow';
import { Translation } from '../../components/Translation';
import type { UIParam , HelmRepo } from '@velaux/data';
import KV from '../KV';

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
  project?: string;
  repo?: HelmRepo;
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
  valueFiles?: Record<string, string>;
  showValuesFile?: boolean;
};
@connect((store: any) => {
  return { ...store.uischema };
})
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
    const { project } = this.props;
    const { helm, repo } = this.props;
    if (helm?.chart && helm.version && helm.url) {
      getChartValueFiles({ ...helm, secretName: repo?.secretName, project: project }).then(
        (re: Record<string, string>) => {
          if (re) {
            try {
              const defaultValueFile = re['values.yaml'];
              const defaultValue = YAML.load(defaultValueFile);
              const newValues: any = {};
              getValues(defaultValue, '', newValues);
              this.setState({ values: newValues, valueFiles: re, helm: helm, loading: false });
            } catch (err) {}
          }
        }
      );
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

  renderHelmKey = (params?: { url: string; chart: string; version: string }) => {
    if (!params) {
      return '';
    }
    return params.url + params.chart + params.version;
  };

  render() {
    const { helm } = this.props;
    const { values, loading, helm: stateHelm, showValuesFile, valueFiles } = this.state;
    if (this.renderHelmKey(helm) != this.renderHelmKey(stateHelm)) {
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
        {valueFiles && (
          <Button
            onClick={() => {
              this.setState({ showValuesFile: true });
            }}
            size="small"
            type="secondary"
          >
            <Translation>Show Values File</Translation>
          </Button>
        )}
        {showValuesFile && valueFiles && (
          <HelmValueShow
            name={helm?.chart || 'default'}
            valueFiles={valueFiles}
            onClose={() => {
              this.setState({ showValuesFile: false });
            }}
          />
        )}
      </Loading>
    );
  }
}

export default HelmValues;
