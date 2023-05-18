import { Select } from '@alifd/next';
import React from 'react';

import { getPolicyList } from '../../api/application';
import { UISchemaContext } from '../../context';
import i18n from '../../i18n';
import type { ApplicationPolicyBase } from '@velaux/data';
import { locale } from '../../utils/locale';

type Props = {
  onChange: (value: any) => void;
  policySelectDataSource?: string[];
  value?: any;
  id: string;
  disabled: boolean;
  appName?: string;
};

type State = {
  policySelectDataSource?: ApplicationPolicyBase[];
};

class PolicySelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      policySelectDataSource: [],
    };
  }

  componentDidMount = () => {
    this.fetchPolicyList();
  };

  fetchPolicyList = async () => {
    const { appName = '' } = this.context;
    if (appName) {
      getPolicyList({
        appName: appName,
      })
        .then((res) => {
          if (res && res.policies) {
            const policyListData = (res.policies || []).map((item: ApplicationPolicyBase) => {
              return {
                label: `${item.name}(${item.type})`,
                value: item.name,
              };
            });
            this.setState({
              policySelectDataSource: policyListData,
            });
          } else {
            this.setState({
              policySelectDataSource: [],
            });
          }
        })
        .catch(() => {
          this.setState({
            policySelectDataSource: [],
          });
        });
    }
  };

  onChange = (value: string) => {
    const { onChange } = this.props;
    onChange(value);
  };

  render() {
    const { value, id, disabled } = this.props;
    const { policySelectDataSource } = this.state;

    return (
      <Select
        placeholder={i18n.t('Please select')}
        onChange={this.onChange}
        id={id}
        disabled={disabled}
        defaultValue={value || []}
        value={value || []}
        dataSource={policySelectDataSource}
        mode="multiple"
        locale={locale().Select}
      />
    );
  }
}

PolicySelect.contextType = UISchemaContext;

export default PolicySelect;
