import React from 'react';
import { Select } from '@b-design/ui';

type Props = {
  onChange: (value: any) => void;
  secretKeys?: string[];
  value: any;
  id: string;
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
    const { onChange, value, secretKeys, id } = this.props;
    return (
      <Select onChange={onChange} defaultValue={value} id={id}>
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
