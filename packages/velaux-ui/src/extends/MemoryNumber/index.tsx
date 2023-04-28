import { Input } from '@alifd/next';
import React from 'react';

type Props = {
  id: string;
  onChange: (value: any) => void;
  value?: any;
  disabled: boolean;
};

type State = {};

class MemoryNumber extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  onChange = (value: string) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(value + 'Mi');
    }
  };

  render() {
    const { value, id, disabled } = this.props;
    let initValue: number | undefined = undefined;
    if (value) {
      initValue = parseInt(value.replace('Mi', ''), 10);
    }
    return (
      <Input
        id={id}
        min="0"
        disabled={disabled}
        addonTextAfter="Mi"
        htmlType="number"
        onChange={this.onChange}
        value={initValue && initValue}
      />
    );
  }
}

export default MemoryNumber;
