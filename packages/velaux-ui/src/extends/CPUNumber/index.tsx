import { Input } from '@alifd/next';
import React from 'react';

type Props = {
  value?: any;
  id: string;
  onChange: (value: any) => void;
  disabled: boolean;
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
    const { value, id, disabled } = this.props;
    let initValue: number | undefined = undefined;
    if (value) {
      initValue = parseFloat(value);
    }

    return (
      <Input
        id={id}
        disabled={disabled}
        addonTextAfter="Core"
        htmlType="number"
        onChange={this.onChange}
        value={initValue && initValue}
      />
    );
  }
}

export default CPUNumber;
