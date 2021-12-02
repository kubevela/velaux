import React from 'react';
import type { UIParam } from '../../interface/application';
import UISchema from '../../components/UISchema';
import './index.less';

type Props = {
  _key?: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
  uiSchema: UIParam[] | undefined;
  onChange?: (params: any) => void;
  value: any;
};

type State = {};

class InnerGroup extends React.Component<Props, State> {
  dom: any;
  ref: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {};
    this.ref = React.createRef();
  }

  render() {
    const { uiSchema, onChange, value } = this.props;
    return (
      <div className="group-inner-container">
        <UISchema
          key={value}
          ref={this.ref}
          uiSchema={uiSchema}
          value={value}
          inline
          onChange={onChange}
        />
      </div>
    );
  }
}

export default InnerGroup;
