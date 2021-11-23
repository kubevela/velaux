import { Select } from '@b-design/ui';
import React from 'react';

type Props = {
  onChange: (value: any) => void;
  setKeys: (keys: string[]) => void;
  value: any;
  id: string;
};

type State = {};

class SecretSelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }

  componentDidMount = async () => {};
  getSecretKeys = (name: string) => {
    return [name, 'key2'];
  };
  onChange = (value: string) => {
    const { onChange, setKeys } = this.props;
    const keys = this.getSecretKeys(value);
    onChange(value);
    setKeys(keys);
  };
  render() {
    const { value, id } = this.props;
    return (
      <Select onChange={this.onChange} value={value} id={id}>
        <Select.Option value="secret1">secret1</Select.Option>
        <Select.Option value="secret2">secret2</Select.Option>
      </Select>
    );
  }
}

export default SecretSelect;
