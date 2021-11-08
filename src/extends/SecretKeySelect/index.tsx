import React from 'react';
import { Select } from '@b-design/ui';

type Props = {
  secretKeys?: string;
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
    return <Select></Select>;
  }
}

export default SecretKeySelect;
