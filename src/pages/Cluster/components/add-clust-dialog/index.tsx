import React from 'react';
import { useState } from 'react';
import { Button, Message, Grid, Dialog, Form, Input, Select } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { addClust, addClustDialog } from '../../../../constants';
import DefinitionCode from '../../../../components/DefinitionCode';
import defineTheme from './theme';
import './index.less';

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

type State = {};

class AddClustDialog extends React.Component<Props, State> {
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
    const { visible } = this.props;
    const { name, describe, namePlaceHold, describePlaceHold, kubeAPI } = addClustDialog;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 4,
      },
      wrapperCol: {
        span: 20,
      },
    };

    return (
      <div>
        <Dialog
          className="dialog-clust-wraper"
          title={addClust}
          autoFocus={true}
          visible={visible}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
        >
          <Form {...formItemLayout}>
            <FormItem label={name}>
              <Input htmlType="name" name="name" placeholder={namePlaceHold} />
            </FormItem>

            <FormItem label={describe}>
              <Input htmlType="describe" name="describe" placeholder={describePlaceHold} />
            </FormItem>
            <FormItem label={kubeAPI}>
              <div id="guideCode" className="guideCode">
                <DefinitionCode
                  containerId="guideCode"
                  language={''}
                  value={''}
                  readOnly={false}
                  defineTheme={defineTheme}
                  // onChange={setCodeValue}
                />
              </div>
            </FormItem>
          </Form>
        </Dialog>
      </div>
    );
  }
}

export default AddClustDialog;
