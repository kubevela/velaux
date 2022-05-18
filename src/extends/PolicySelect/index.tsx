import React from 'react';
import { connect } from 'dva';
import { Select } from '@b-design/ui';
import { getPolicyList } from '../../api/application';
import type { PolicyBase } from '../../interface/application';
import locale from '../../utils/locale';
import i18n from '../../i18n';

type Props = {
  onChange: (value: any) => void;
  policySelectDataSource?: string[];
  value: any;
  id: string;
  disabled: boolean;
  appName?: string;
};

type State = {
  policySelectDataSource?: PolicyBase[];
};

@connect((store: any) => {
  return { ...store.uischema };
})
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
    const { appName = '' } = this.props;
    if (appName) {
      getPolicyList({
        name: appName,
      })
        .then((res) => {
          if (res && res.policies) {
            const policyListData = (res.policies || []).map(
              (item: PolicyBase) => `${item.name}(${item.type})`,
            );
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

export default PolicySelect;
