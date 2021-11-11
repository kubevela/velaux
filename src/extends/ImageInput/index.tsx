import React from 'react';
import { Input } from '@b-design/ui';
import './index.less';

type Props = {
  value: any;
  id: string;
  onChange: (value: any) => void;
};

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
    const { onChange, value } = this.props;
    return <Input onChange={onChange} defaultValue={value} />;
  }
}

export default ImageInput;
