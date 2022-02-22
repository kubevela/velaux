import React from 'react';
import { Input } from '@b-design/ui';
import './index.less';

import type { InputProps } from '@alifd/next/types/input';

interface Props extends InputProps {
  value: any;
  id: string;
  onChange: (value: any) => void;
  disabled: boolean;
}

type State = {};

class ImageInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }

  componentDidMount = async () => {};

  render() {
    const { value } = this.props;
    return <Input {...this.props} defaultValue={value} />;
  }
}

export default ImageInput;
