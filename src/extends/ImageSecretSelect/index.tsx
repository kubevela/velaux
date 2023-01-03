import React, { Component } from 'react';
import { Loading, Select } from '@b-design/ui';
import i18n from '../../i18n';
import locale from '../../utils/locale';
import { getImageRepos } from '../../api/repository';
import type { ImageRegistry } from '../../interface/repository';
import { connect } from 'dva';

type Props = {
  value?: any;
  onChange: (value: any) => void;
  id: string;
  disabled: boolean;
  dispatch?: ({}) => {};
  project?: string;
  imageSecret?: string;
};

type State = {
  registries: ImageRegistry[];
  inputRepo: string;
  loading: boolean;
  values?: string[];
};
@connect((store: any) => {
  return { ...store.uischema };
})
class ImageSecretSelect extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      registries: [],
      inputRepo: '',
    };
  }
  componentDidMount() {
    this.onLoadRepos();
  }

  onLoadRepos = () => {
    const { project } = this.props;
    if (project) {
      this.setState({ loading: true });
      getImageRepos({ project: project })
        .then((res) => {
          if (res) {
            this.setState({
              registries: res.registries,
            });
          }
        })
        .finally(() => {
          this.setState({ loading: false });
        });
    }
  };

  onSearch = (value: string) => {
    this.setState({ inputRepo: value });
  };

  convertImageRegistryOptions(data: ImageRegistry[]): { label: string; value: string }[] {
    return (data || []).map((item: ImageRegistry) => {
      let label = item.secretName;
      if (item.domain) {
        label = `${item.secretName}(${item.domain})`;
      }
      return { label: label, value: item.secretName };
    });
  }

  render() {
    const { disabled, onChange, value } = this.props;
    const { registries, loading, inputRepo } = this.state;
    const dataSource = registries || [];
    if (inputRepo) {
      dataSource.unshift({ secretName: inputRepo, name: inputRepo });
    }
    const transDataSource = this.convertImageRegistryOptions(dataSource);
    return (
      <Loading visible={loading} style={{ width: '100%' }}>
        <Select
          placeholder={i18n.t('Please select or input your owner image registry secret')}
          inputMode="url"
          mode="multiple"
          onChange={onChange}
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

export default ImageSecretSelect;
