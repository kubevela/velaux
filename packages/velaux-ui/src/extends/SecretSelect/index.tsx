import { connect } from 'dva';
import i18n from 'i18next';
import React from 'react';

import { listCloudResourceSecrets } from '../../api/observation';
import { CustomSelect } from '../../components/CustomSelect';
import type { Secret } from '@velaux/data';
import { locale } from '../../utils/locale';

type Props = {
  onChange: (value: any) => void;
  setKeys: (keys: string[]) => void;
  value?: any;
  id: string;
  appNamespace?: string;
  disabled: boolean;
};

type State = {
  secrets?: Secret[];
};

@connect((store: any) => {
  return { ...store.uischema };
})
class SecretSelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount = async () => {
    this.loadSecrets();
  };
  getSecretKeys = (name: string) => {
    const { secrets } = this.state;
    let keys: string[] = [];
    secrets?.map((secret) => {
      if (secret.metadata.labels['app.oam.dev/sync-alias'] == name && 'data' in secret) {
        keys = Object.keys(secret.data);
      }
    });
    return keys;
  };
  onChange = (value: string) => {
    const { onChange, setKeys } = this.props;
    const keys = this.getSecretKeys(value);
    onChange(value);
    setKeys(keys);
  };
  loadSecrets = () => {
    if (this.props.appNamespace) {
      listCloudResourceSecrets({ appNs: this.props.appNamespace }).then((res) => {
        if (res) {
          this.setState({ secrets: res.secrets }, () => {
            const keys = this.getSecretKeys(this.props.value);
            this.props.setKeys(keys);
          });
        }
      });
    }
  };
  render() {
    const { value, id, disabled } = this.props;
    const { secrets } = this.state;
    const filters = secrets?.filter((secret) => secret.metadata.labels['app.oam.dev/sync-alias']);
    const dataSource =
      filters?.map((secret) => {
        return {
          label: secret.metadata.labels['app.oam.dev/sync-alias'],
          value: secret.metadata.labels['app.oam.dev/sync-alias'],
        };
      }) || [];
    return (
      <CustomSelect
        locale={locale().Select}
        onChange={this.onChange}
        value={value}
        id={id}
        disabled={disabled}
        placeholder={i18n.t('Please select or input a secret name').toString()}
        enableInput={true}
        dataSource={dataSource}
      />
    );
  }
}

export default SecretSelect;
