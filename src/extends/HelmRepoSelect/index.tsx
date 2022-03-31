import React, { Component } from 'react';
import { Loading, Select } from '@b-design/ui';
import i18n from '../../i18n';
import locale from '../../utils/locale';

type Props = {
  value?: any;
  onChange: (value: any) => void;
  id: string;
  disabled: boolean;
  helm?: { repoType: string };
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
      repos: [],
      inputRepo: '',
    };
  }
  componentDidMount() {
    if (!this.props.helm?.repoType || this.props.helm?.repoType == 'helm') {
      this.onLoadRepos();
    }
  }

  onLoadRepos = () => {
    this.setState({
      repos: ['https://charts.bitnami.com/bitnami', 'https://charts.kubevela.net/core'],
    });
  };

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
    if (this.props.helm?.repoType == 'helm' && dataSource.length == 0) {
      this.onLoadRepos();
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
