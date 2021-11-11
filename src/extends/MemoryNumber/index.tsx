import React from 'react';
import { Input } from '@b-design/ui';

type Props = {
  onChange: (value: any) => void;
  value: any;
};

type State = {};

class MemoryNumber extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }

  render() {
    const { onChange, value } = this.props;
    return <Input addonTextAfter="MB" htmlType="number" onChange={onChange} defaultValue={value} />;
  }
}

export default MemoryNumber;
