import React from 'react';
import { Input } from '@b-design/ui';
type DataSource = Array<{ label: string; value: any }>;

type Props = {};

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
    return <Input addonTextAfter="Core" htmlType="number" />;
  }
}

export default CPUNumber;
