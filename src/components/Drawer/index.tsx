import React, { Component } from 'react';
import { Drawer, Button } from '@b-design/ui';
import './index.less';
import { If } from 'tsx-control-statements/components';
import Translation from '../Translation';

type Props = {
  dialogStats:string;
  changeStatus:(params:string)=>void;
  onSubmit:()=>void;
  onOk?: () => void;
  onClose: () => void;
  width?: number | string;
  title: string | React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  enableForm?: boolean;
  children?: React.ReactNode;
};

class DrawerWithFooter extends Component<Props, any> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { children, title, placement, width, onOk, onClose,dialogStats, changeStatus, onSubmit } = this.props;
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
            <If condition={dialogStats==='isBasic'}>
              <Button type='secondary' onClick={onClose} className='margin-right-10'>
                <Translation>Cancle</Translation>
              </Button>
              <Button type="primary" onClick={()=>{changeStatus('isCreateComponent')}}>
                <Translation>NextStep</Translation>
              </Button>
            </If>
            <If condition={dialogStats==='isCreateComponent'}>
              <Button type='secondary' onClick={()=>{changeStatus('isBasic')}} className='margin-right-10'>
                <Translation>Previous</Translation>
              </Button>
              <Button type="primary" onClick={onSubmit}>
                <Translation>Create</Translation>
              </Button>
            </If>
          </div>
        </div>
      </Drawer>
    );
  }
}

export default DrawerWithFooter;
