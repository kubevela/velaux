import React from 'react';
import { Input } from '@b-design/ui';

type Props = {
  value: any;
  id: string;
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

  onChange = (value: string) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(`${value}`);
    }
  };

  render() {
    const { value, id } = this.props;
    let initValue = undefined;
    if (value) {
      initValue = parseFloat(value);
    }

    return (
      <Input
        id={id}
        addonTextAfter="Core"
        htmlType="number"
        onChange={this.onChange}
        value={initValue && initValue}
      />
    );
  }
}

export default CPUNumber;
