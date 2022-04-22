import React from 'react';
import { Input } from '@b-design/ui';
import { checkImageName } from '../../api/project';
import './index.less';

import type { InputProps } from '@alifd/next/types/input';

interface Props extends InputProps {
  value: any;
  id: string;
  onChange: (value: any) => void;
  disabled: boolean;
  onChangeImagePullSecretsRef: (data: string[]) => void;
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

  onCheckImageName = () => {
    const { value, onChangeImagePullSecretsRef } = this.props;
    const imagePullSecret: string[] = [];
    const imageData = {
      image: value,
    };
    checkImageName(imageData).then((res) => {
      const data = (res && res.data) || {};
      if (data.existed && data.sercet) {
        imagePullSecret.push(data.sercet);
        onChangeImagePullSecretsRef(imagePullSecret);
      }
    });
  };

  render() {
    const { value } = this.props;
    return <Input {...this.props} defaultValue={value} onBlur={this.onCheckImageName} />;
  }
}

export default ImageInput;
