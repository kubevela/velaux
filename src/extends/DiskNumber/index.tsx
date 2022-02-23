import React from 'react';
import { Input } from '@b-design/ui';

type Props = {
  id: string;
  onChange: (value: any) => void;
  value: any;
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
    let initValue = undefined;
    if (value) {
      initValue = parseInt(value.replace('Gi', ''));
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
