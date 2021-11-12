import { Select } from '@b-design/ui';
import React from 'react';

type Props = {
  onChange: (value: any) => void;
  value: any;
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

  render() {
    const { onChange, value } = this.props;
    return <Select onChange={onChange} defaultValue={value}></Select>;
  }
}

export default SecretSelect;
