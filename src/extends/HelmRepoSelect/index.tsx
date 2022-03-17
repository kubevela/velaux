import React, { Component } from 'react';
import { Loading, Select } from '@b-design/ui';
import i18n from '../../i18n';
import locale from '../../utils/locale';

type Props = {
  value?: any;
  onChange: (value: any) => void;
  id: string;
  disabled: boolean;
};

type State = {
  repos: string[];
  inputRepo: string;
  loading: boolean;
};

class HelmRepoSelect extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      repos: [
        'https://charts.bitnami.com/bitnami',
        'https://kubevelacharts.oss-cn-hangzhou.aliyuncs.com/core',
      ],
      inputRepo: '',
    };
  }
  componentDidMount() {}

  onSearch = (value: string) => {
    this.setState({ inputRepo: value });
  };
  render() {
    const { disabled, value, onChange } = this.props;
    const { repos, loading, inputRepo } = this.state;
    const dataSource = Array.from(repos);
    if (inputRepo) {
      dataSource.unshift(inputRepo);
    }
    return (
      <Loading visible={loading} style={{ width: '100%' }}>
        <Select
          placeholder={i18n.t('Please select or input your owner helm repo')}
          onChange={onChange}
          inputMode="url"
          disabled={disabled}
          showSearch={true}
          onSearch={this.onSearch}
          followTrigger={true}
          value={value}
          dataSource={dataSource}
          locale={locale.Select}
        />
      </Loading>
    );
  }
}

export default HelmRepoSelect;
