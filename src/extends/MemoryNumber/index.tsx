import React from 'react';
import { Input } from '@b-design/ui';

type Props = {
  id: string;
  onChange: (value: any) => void;
  value: any;
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
    const { value, id } = this.props;
    let initValue = undefined;
    if (value) {
      initValue = parseInt(value.replace('Mi', ''));
    }
    return (
      <Input
        id={id}
        min="0"
        addonTextAfter="MB"
        htmlType="number"
        onChange={this.onChange}
        value={initValue && initValue}
      />
    );
  }
}

export default MemoryNumber;
