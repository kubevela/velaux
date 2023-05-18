import { Loading, Select } from '@alifd/next';
import { connect } from 'dva';
import _ from 'lodash';
import React, { Component } from 'react';

import { getChartRepos } from '../../api/repository';
import i18n from '../../i18n';
import type { HelmRepo } from '@velaux/data';
import { locale } from '../../utils/locale';

type Props = {
  value?: any;
  onChange: (value: any) => void;
  id: string;
  disabled: boolean;
  dispatch?: ({}) => {};
  helm?: { repoType: string };
  project?: string;
  onChangeSecretRef: (secretName: string) => void;
};

type State = {
  repos: HelmRepo[];
  inputRepo: string;
  loading: boolean;
};
@connect((store: any) => {
  return { ...store.uischema };
})
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
      this.onLoadRepos(this.props.helm?.repoType || 'helm');
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const repoType = nextProps.helm?.repoType;
    if (repoType !== this.props.helm?.repoType && (repoType == 'helm' || repoType == 'oci')) {
      this.onLoadRepos(repoType);
    }
  }

  onLoadRepos = (repoType?: string) => {
    const { project } = this.props;
    const defaultRepos = [{ url: 'https://charts.bitnami.com/bitnami', type: 'helm' }];
    this.setState({ loading: true, repos: repoType === 'helm' ? defaultRepos : [] });
    getChartRepos({ project: project }).then((res) => {
      let repos: HelmRepo[] = [];
      if (res && res.repos) {
        res.repos.map((repo: HelmRepo) => {
          if (repoType == 'oci' && repo.url.startsWith('oci://')) {
            repos.push(repo);
          }
          if (repoType == 'helm' && !repo.url.startsWith('oci://')) {
            repos.push(repo);
          }
        });
      }
      if (repoType == 'helm') {
        repos = repos.concat(defaultRepos);
      }
      this.setState({
        repos: repos,
        loading: false,
      });
    });
  };

  onSearch = (value: string) => {
    this.setState({ inputRepo: value });
  };

  onChange = (value: string) => {
    const { onChange, dispatch, onChangeSecretRef } = this.props;
    this.state.repos.map((repo) => {
      if (repo.url == value && repo.secretName != '' && dispatch) {
        dispatch({
          type: 'uischema/setHelmRepo',
          payload: repo,
        });
      }
    });
    onChange(value);
    const secretName = this.findSecretName(value);
    onChangeSecretRef(secretName);
  };

  findSecretName = (value: string) => {
    const { repos = [] } = this.state;
    const findSecretObj = _.find(repos, (item) => {
      return item.url === value;
    });
    return findSecretObj?.secretName || '';
  };

  convertHelmRepositoryOptions(data: HelmRepo[]): Array<{ label: string; value: string }> {
    return (data || []).map((item: { url: string; secretName?: string }) => {
      let label = item.url;
      if (item.secretName) {
        label = `(${item.secretName}) ${item.url}`;
      }
      return { label: label, value: item.url };
    });
  }

  render() {
    const { disabled, value } = this.props;
    const { repos, loading, inputRepo } = this.state;
    const dataSource = repos;
    if (inputRepo) {
      dataSource.unshift({ url: inputRepo, type: 'helm' });
    }
    const transDataSource = this.convertHelmRepositoryOptions(dataSource);
    return (
      <Loading visible={loading} style={{ width: '100%' }}>
        <Select
          placeholder={i18n.t('Please select or input your owner helm repo')}
          onChange={this.onChange}
          inputMode="url"
          disabled={disabled}
          showSearch={true}
          onSearch={this.onSearch}
          followTrigger={true}
          value={value}
          dataSource={transDataSource}
          locale={locale().Select}
        />
      </Loading>
    );
  }
}

export default HelmRepoSelect;
