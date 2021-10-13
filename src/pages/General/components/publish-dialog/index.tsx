import React from 'react';
import { useState } from 'react';
import { Button, Message, Grid, Dialog, Form, Input, Select } from '@b-design/ui';
import { withTranslation } from 'react-i18next';

import { publishDialog } from '../../constants';
import './index.less';

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  t: (key: string) => {};
};

type State = {};

class PublishDialog extends React.Component<Props, State> {
  onClose = () => {
    this.props.setVisible(false);
  };
  onOk = () => {
    this.props.setVisible(false);
  };

  handleSelectProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('chose', e);
  };

  handleSelectCluster = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('chose', e);
  };

  render() {
    const { Row, Col } = Grid;
    const { visible, t } = this.props;
    const { title, name, namePlaceHold, version, versionPlaceHold } = publishDialog;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 4,
      },
      wrapperCol: {
        span: 20,
      },
    };

    const namePlacehold = t(namePlaceHold).toString();
    const versionPlacehold = t(versionPlaceHold).toString();
    const confirm = t('Confirm').toString();
    return (
      <div>
        <Dialog
          className="dialog-app-wraper"
          locale={{
            ok: confirm,
            cancel: 'no',
          }}
          title={title}
          autoFocus={true}
          visible={visible}
          footerActions={['ok']}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
        >
          <Form {...formItemLayout}>
            <FormItem label={name}>
              <Input htmlType="name" name="name" placeholder={namePlacehold} />
            </FormItem>

            <FormItem label={version}>
              <Input htmlType="version" name="version" placeholder={versionPlacehold} />
            </FormItem>
          </Form>
        </Dialog>
      </div>
    );
  }
}

export default withTranslation()(PublishDialog);
