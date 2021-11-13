import React, { Component } from 'react';
import { Drawer, Button } from '@b-design/ui';
import './index.less';
import { If } from 'tsx-control-statements/components';
import Translation from '../Translation';

type Props = {
  onOk?: () => void;
  onClose: () => void;
  width?: number | string;
  title: string | React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  enableForm?: boolean;
  children?: React.ReactNode;
  extButtons?: React.ReactNode;
};

class DrawerWithFooter extends Component<Props, any> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { children, title, placement, width, onOk, onClose, extButtons } = this.props;
    return (
      <Drawer
        title={title}
        closeMode="mask"
        closeable="close"
        onClose={onClose}
        visible={true}
        autoFocus={true}
        placement={placement || 'right'}
        width={width || '600px'}
      >
        <div style={{ paddingBottom: '60px' }}>
          {children}
          <div className="drawer-footer">
            <If condition={onOk}>
              <Button type="primary" onClick={onOk}>
                <Translation>Submit</Translation>
              </Button>
            </If>

            {extButtons}
          </div>
        </div>
      </Drawer>
    );
  }
}

export default DrawerWithFooter;
