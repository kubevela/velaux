import React from 'react';
import { Input } from '@b-design/ui';
import axios from 'axios';

type DataSource = Array<{ label: string; value: any }>;

type Props = {};

type State = {};

class MemoryNumber extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }

  componentDidMount = async () => {};

  render() {
    return <Input addonTextAfter="MB" htmlType="number" />;
  }
}

export default MemoryNumber;
