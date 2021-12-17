import { Select } from '@b-design/ui';
import { connect } from 'dva';
import React from 'react';
import { listCloudResourceSecrets } from '../../api/observation';
import type { Secret } from '../../interface/observation';
import locale from '../../utils/locale';

type Props = {
  onChange: (value: any) => void;
  setKeys: (keys: string[]) => void;
  value: any;
  id: string;
  appNamespace?: string;
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
    const { value, id } = this.props;
    const { secrets } = this.state;
    const filters = secrets?.filter((secret) => secret.metadata.labels['app.oam.dev/sync-alias']);
    return (
      <Select locale={locale.Select} onChange={this.onChange} value={value} id={id}>
        {filters?.map((secret) => {
          return (
            <Select.Option
              key={secret.metadata.name}
              value={secret.metadata.labels['app.oam.dev/sync-alias']}
            >
              {secret.metadata.labels['app.oam.dev/sync-alias']}
            </Select.Option>
          );
        })}
      </Select>
    );
  }
}

export default SecretSelect;
