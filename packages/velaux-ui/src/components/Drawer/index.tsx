import { Drawer, Button } from '@alifd/next';
import React, { Component } from 'react';

import './index.less';
import { If } from '../If';
import { Translation } from '../Translation';

type Props = {
  onOk?: () => void;
  onOkButtonText?: string;
  onOkButtonLoading?: boolean;
  onClose: () => void;
  width?: number | string;
  title?: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  children?: React.ReactNode;
  extButtons?: React.ReactNode;
  visible?: boolean;
};

class DrawerWithFooter extends Component<Props, any> {
  render() {
    const { visible, children, title, placement, width, onOk, onClose, extButtons, onOkButtonText, onOkButtonLoading } =
      this.props;
    return (
      <Drawer
        title={<>{title}</>}
        closeMode="close"
        className="customDrawer"
        closeable="close"
        onClose={onClose}
        visible={visible || true}
        autoFocus={true}
        placement={placement || 'right'}
        width={width || '600px'}
      >
        <div style={{ paddingBottom: '60px' }}>
          {children}
          <div className="drawer-footer">
            {extButtons}
            <If condition={onOk}>
              <Button loading={onOkButtonLoading} type="primary" onClick={onOk}>
                <Translation>{onOkButtonText ? onOkButtonText : 'Submit'}</Translation>
              </Button>
            </If>
          </div>
        </div>
      </Drawer>
    );
  }
}

export default DrawerWithFooter;
