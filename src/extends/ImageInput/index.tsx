import React from 'react';
import { Input } from '@b-design/ui';
import './index.less';
import { ImageInfo } from '../../interface/applicationplan';

type Props = {
  onUpdate?: (arg: ImageInfo) => void;
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
    return <Input />;
  }
}

export default ImageInput;
