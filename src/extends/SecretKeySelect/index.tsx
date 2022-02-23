import React from 'react';
import { Select } from '@b-design/ui';
import locale from '../../utils/locale';
import i18n from 'i18next';

type Props = {
  onChange: (value: any) => void;
  secretKeys?: string[];
  value: any;
  id: string;
  disabled: boolean;
};

type State = {};

class SecretKeySelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }

  componentDidMount = async () => {};

  render() {
    const { onChange, value, secretKeys, id, disabled } = this.props;
    return (
      <Select
        locale={locale.Select}
        onChange={onChange}
        defaultValue={value}
        id={id}
        disabled={disabled}
        value={value}
        placeholder={i18n.t('Please select the secret key').toString()}
      >
        {secretKeys?.map((item) => {
          return (
            <Select.Option key={item} value={item}>
              {item}
            </Select.Option>
          );
        })}
      </Select>
    );
  }
}

export default SecretKeySelect;
