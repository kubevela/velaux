import { Input } from '@alifd/next';
import React from 'react';

type Props = {
  id: string;
  onChange: (value: any) => void;
  value?: any;
  disabled: boolean;
};

type State = {};

class DiskNumber extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  onChange = (value: string) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(value + 'Gi');
    }
  };

  render() {
    const { value, id, disabled } = this.props;
    let initValue: number | undefined = undefined;
    if (value) {
      initValue = parseInt(value.replace('Gi', ''), 10);
    }
    return (
      <Input
        id={id}
        disabled={disabled}
        min="0"
        addonTextAfter="Gi"
        htmlType="number"
        onChange={this.onChange}
        value={initValue}
      />
    );
  }
}

export default DiskNumber;
