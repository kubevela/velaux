import React from 'react';
import { Balloon } from '@b-design/ui';
import { UIParam } from '../../interface/application';
import UISchema from '../../components/UISchema';
import './index.less';

type Props = {
  _key?: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
  uiSchema: Array<UIParam> | undefined;
  onChange?: (params: any) => void;
  value: any;
};

type State = {};

class InnerGroup extends React.Component<Props, State> {
  dom: any;
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    const { title, description, uiSchema, onChange, _key } = this.props;

    return (
      <div className="group-inner-container">
        <div>
          <Balloon trigger={title} align="t">
            <div>{description}</div>
          </Balloon>
        </div>
        <UISchema uiSchema={uiSchema} inline onChange={onChange} _key={_key} />
      </div>
    );
  }
}

export default InnerGroup;
