import React, { Component } from 'react';
import { getChartVersions } from '../../api/repository';
import { Loading, Select } from '@b-design/ui';
import type { ChartVersion } from '../../interface/application';
import i18n from '../../i18n';
import locale from '../../utils/locale';

type Props = {
  value?: any;
  onChange: (value: any) => void;
  id: string;
  disabled: boolean;
  helm?: {
    url: string;
    repoType: string;
    chart: string;
  };
};

type State = {
  versions?: ChartVersion[];
  loading: boolean;
  inputChartVersion: string;
  helm?: {
    url: string;
    repoType: string;
    chart: string;
  };
};

class HelmChartVersionSelect extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      inputChartVersion: '',
    };
  }
  componentDidMount() {
    this.loadChartVersions();
  }

  loadChartVersions = () => {
    const { helm } = this.props;
    if (
      helm?.url &&
      helm.chart &&
      !this.state.loading &&
      (helm.url != this.state.helm?.url || helm.chart != this.state.helm.chart)
    ) {
      this.setState({ loading: true, helm: helm });
      // Reset version value
      if (this.state.helm) {
        this.props.onChange('');
      }
      getChartVersions(helm).then((re: { versions: ChartVersion[] }) => {
        if (re) {
          this.setState({ versions: re.versions || [], loading: false, helm: helm });
        }
      });
    }
  };

  onSearch = (value: string) => {
    this.setState({ inputChartVersion: value });
  };

  render() {
    const { disabled, value, onChange, helm } = this.props;
    const { versions, loading, helm: stateHelm, inputChartVersion } = this.state;
    if (helm?.url != stateHelm?.url || helm?.chart != stateHelm?.chart) {
      this.loadChartVersions();
    }
    const dataSource =
      versions?.map((version) => {
        return {
          label: version.version,
          value: version.version,
        };
      }) || [];
    if (inputChartVersion) {
      dataSource.unshift({ label: inputChartVersion, value: inputChartVersion });
    }
    return (
      <Loading visible={loading} style={{ width: '100%' }}>
        <Select
          placeholder={i18n.t('Please select or input a chart version')}
          onChange={onChange}
          onSearch={this.onSearch}
          showSearch={true}
          followTrigger={true}
          disabled={disabled}
          value={value}
          dataSource={dataSource}
          locale={locale.Select}
        />
      </Loading>
    );
  }
}

export default HelmChartVersionSelect;
