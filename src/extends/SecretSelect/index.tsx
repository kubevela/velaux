import { Select } from '@b-design/ui';
import React from 'react';

type DataSource = Array<{ label: string; value: any }>;

type Props = {};

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
    return <Select></Select>;
  }
}

export default SecretSelect;
