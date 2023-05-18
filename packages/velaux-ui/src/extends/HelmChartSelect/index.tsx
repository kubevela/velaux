import { Loading, Select } from '@alifd/next';
import { connect } from 'dva';
import React, { Component } from 'react';

import { getCharts } from '../../api/repository';
import i18n from '../../i18n';
import type { HelmRepo } from '@velaux/data';
import { locale } from '../../utils/locale';

type Props = {
  value?: any;
  onChange: (value: any) => void;
  id: string;
  disabled: boolean;
  helm?: {
    url: string;
    repoType: string;
  };
  project?: string;
  repo?: HelmRepo;
};

type State = {
  charts?: string[];
  loading: boolean;
  inputChart: string;
  helm?: {
    url: string;
    repoType: string;
  };
};
@connect((store: any) => {
  return { ...store.uischema };
})
class HelmChartSelect extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      inputChart: '',
    };
  }
  componentDidMount() {
    this.loadCharts();
  }

  loadCharts = () => {
    const { project } = this.props;
    const { helm, repo } = this.props;
    if (helm?.url && (!this.state.loading || this.state.helm?.url != helm.url)) {
      // Reset chart value
      if (this.state.helm) {
        this.props.onChange('');
      }
      this.setState({ loading: true, helm: helm });
      getCharts({ url: helm.url, repoType: helm.repoType, secretName: repo?.secretName, project: project }).then(
        (re: string[]) => {
          this.setState({ charts: re && Array.isArray(re) ? re : [], loading: false, helm: helm });
        }
      );
    }
  };

  onSearch = (value: string) => {
    this.setState({ inputChart: value });
  };

  render() {
    const { disabled, value, onChange, helm } = this.props;
    const { charts, loading, helm: stateHelm, inputChart } = this.state;
    if (helm?.url != stateHelm?.url) {
      this.loadCharts();
    }
    const dataSource = (charts || []).map((item) => {
      return {
        label: item,
        value: item,
      };
    });

    if (inputChart) {
      dataSource.unshift({
        label: inputChart,
        value: inputChart,
      });
    }

    return (
      <Loading visible={loading} style={{ width: '100%' }}>
        <Select
          placeholder={i18n.t('Please select or input a chart name')}
          onChange={onChange}
          showSearch={true}
          onSearch={this.onSearch}
          followTrigger={true}
          disabled={disabled}
          value={value}
          dataSource={dataSource}
          locale={locale().Select}
        />
      </Loading>
    );
  }
}

export default HelmChartSelect;
