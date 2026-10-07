import { Button, Dialog } from '@alifd/next';
import React from 'react';

import { Translation } from '../Translation';
import './index.less';

type Props = {
  onOk?: () => void;
  onOkButtonText?: string;
  onOkButtonLoading?: boolean;
  onClose: () => void;
  width?: number | string;
  title?: React.ReactNode;
  children?: React.ReactNode;
  extButtons?: React.ReactNode;
};

// ModalWithFooter is DrawerWithFooter as a centred modal: the same props, its
// buttons in the footer, and a body that scrolls within the window. It is 60%
// of the window wide unless given a width.
const ModalWithFooter = (props: Props) => {
  const { children, title, width, onOk, onClose, extButtons, onOkButtonText, onOkButtonLoading } = props;
  return (
    <Dialog
      v2
      visible
      title={title}
      width={width || '60vw'}
      onClose={onClose}
      className="modal-with-footer"
      footer={
        <div className="modal-with-footer-actions">
          {extButtons}
          {onOk && (
            <Button loading={onOkButtonLoading} type="primary" onClick={onOk}>
              <Translation>{onOkButtonText ? onOkButtonText : 'Submit'}</Translation>
            </Button>
          )}
        </div>
      }
    >
      {children}
    </Dialog>
  );
};

export default ModalWithFooter;
