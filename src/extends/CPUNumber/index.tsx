import React from 'react';
import { Input } from '@b-design/ui';

type Props = {
  value: any;
  onChange: (value: any) => void;
};

type State = {};

class CPUNumber extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }

  componentDidMount = async () => {};

  render() {
    const { onChange, value } = this.props;
    return (
      <Input addonTextAfter="Core" htmlType="number" onChange={onChange} defaultValue={value} />
    );
  }
}

export default CPUNumber;
