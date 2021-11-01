import React from 'react';
import { Input } from '@b-design/ui';
import './index.less';

type Props = {
  url: string;
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
    return (
      <div className="image-input-container">
        <Input />
      </div>
    );
  }
}

export default ImageInput;
