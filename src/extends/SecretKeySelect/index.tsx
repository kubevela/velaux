import React from 'react';
import locale from '../../utils/locale';
import i18n from 'i18next';
import { CustomSelect } from '../../components/CustomSelect';

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
      <CustomSelect
        locale={locale().Select}
        onChange={onChange}
        defaultValue={value}
        id={id}
        disabled={disabled}
        value={value}
        placeholder={i18n.t('Please select or input a secret key').toString()}
        enableInput={true}
        dataSource={
          secretKeys?.map((item) => {
            return { label: item, value: item };
          }) || []
        }
      />
    );
  }
}

export default SecretKeySelect;
