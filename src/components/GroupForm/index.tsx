import React from 'react';
import { UIParam } from '../../interface/application';
import UISchema from '../UISchema';

type Props = {
  uiSchema?: Array<UIParam>;
  id: string;
  value: any;
  _key?: string;
  onChange: (value: any) => void;
};

type State = {};

class GroupForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { onChange, uiSchema, _key } = this.props;
    return <UISchema uiSchema={uiSchema} onChange={onChange} _key={_key} />;
  }
}

export default GroupForm;
