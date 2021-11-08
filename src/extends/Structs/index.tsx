import { Form } from '@b-design/ui';
import React from 'react';
import { If } from 'tsx-control-statements/components';
import { UIParam } from '../../interface/applicationplan';

type Props = {
  param: UIParam;
};

type State = {};

class Structs extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount = async () => {};

  render() {
    const { param } = this.props;
    return (
      <Form.Item label={param.label} help={param.description}>
        <If condition={param.subParameterGroupOption}>
          <span>多种选项设置</span>
        </If>
        {/* 一行最大3个表单，超过3个换行 */}
      </Form.Item>
    );
  }
}

export default Structs;
