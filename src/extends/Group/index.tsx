import React from 'react';

import { Icon, Loading } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import './index.less';

type Props = {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
  closed?: boolean;
  loading?: boolean;
  hasToggleIcon?: boolean;
};

type State = {
  closed: boolean | undefined;
};

class Group extends React.Component<Props, State> {
  dom: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      closed: props.closed,
    };
  }

  toggleShowClass = () => {
    const { closed } = this.state;
    this.setState({
      closed: !closed,
    });
  };
  render() {
    const { title, description, children, hasToggleIcon, loading } = this.props;
    const { closed } = this.state;
    return (
      <Loading visible={loading || false} style={{ width: '100%' }}>
        <div className="group-container">
          <div
            className="group-title-container"
            onClick={hasToggleIcon ? this.toggleShowClass : () => {}}
          >
            {title}
            <div className="group-title-desc">{description}</div>
            <If condition={hasToggleIcon}>
              <Icon className="icon" style={{ top: 0 }} type={closed ? 'arrow-down' : 'arrow-up'} />
            </If>
          </div>
          <If condition={!hasToggleIcon || !closed}>
            <div className="group-box">{children}</div>
          </If>
          <If condition={closed}>
            <div className="group-box disable">{children}</div>
          </If>
        </div>
      </Loading>
    );
  }
}

export default Group;
