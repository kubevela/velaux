import { Switch } from '@alifd/next';
import React from 'react';

type Props = {
  value: boolean;
  id: string;
  onChange: (value: any) => void;
};

type State = {};

class SwitchComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    const { value, onChange, id } = this.props;
    return (
      <Switch
        autoWidth
        checkedChildren="on"
        unCheckedChildren="off"
        defaultChecked={value}
        id={id}
        onChange={(v) => onChange(v)}
      />
    );
  }
}

export default SwitchComponent;
