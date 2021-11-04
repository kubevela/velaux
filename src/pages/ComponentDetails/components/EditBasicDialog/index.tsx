import React, { Component } from 'react';
import { Dialog, Grid, Button, Form, Field, Input, Message } from '@b-design/ui';
import {
  EDIT_CONFIGURATION,
  DEPLOYMENT_STATUS,
  ENV_DISTRUIBUTION,
  UPDATE_TIME,
  CREATION_TIME,
  OWNING_APPLICATION,
  DEPLOYMENT_VERSION,
} from '../../constants';
import { formItemLayout } from '../../../../utils/common';
import Translation from '../../../../components/Translation';

type Props = {
  visible: boolean;
  onOK: () => void;
  onClose: () => void;
  dispatch: ({}) => {};
};

type State = {};

class EditBasicDialog extends Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {};
  }
  onClose = () => {
    this.props.onClose();
    this.resetField();
  };

  onOk = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      this.props.dispatch({
        type: 'clusters/createCluster',
        payload: values,
        callback: () => {
          Message.success(<Translation>cluster add success</Translation>);
          this.resetField();
          this.props.onOK();
        },
      });
    });
  };

  resetField() {
    this.field.setValues({
      name: '',
      description: '',
      dashboardURL: '',
      kubeConfig: '',
    });
  }

  render() {
    const { visible } = this.props;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const init = this.field.init;
    return (
      <Dialog
        className="dialog-clust-wraper"
        title={EDIT_CONFIGURATION}
        autoFocus={true}
        visible={visible}
        onOk={this.onOk}
        onCancel={this.onClose}
        onClose={this.onClose}
        footerActions={['ok', 'cancel']}
        footerAlign="center"
      >
        <Form {...formItemLayout} field={this.field}>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={DEPLOYMENT_STATUS} required>
                <Input
                  htmlType="status"
                  name="status"
                  placeholder={'请输入'}
                  {...init('status', {
                    rules: [
                      {
                        required: true,
                        message: 'Please enter a valid English name',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={OWNING_APPLICATION}>
                <Input
                  name="ownerApplication"
                  placeholder={'请输入'}
                  {...init('ownerApplication', {
                    rules: [
                      {
                        minLength: 2,
                        message: 'Enter Env',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={ENV_DISTRUIBUTION}>
                <Input htmlType="env" name="env" placeholder={'请输入'} {...init('env')} />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={DEPLOYMENT_VERSION}>
                <Input
                  htmlType="version"
                  name="version"
                  placeholder={'请输入'}
                  {...init('version', {})}
                />
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={UPDATE_TIME}>
                <Input
                  htmlType="updateTime"
                  name="updateTime"
                  placeholder={'请输入'}
                  {...init('updateTime')}
                />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={DEPLOYMENT_VERSION}>
                <Input
                  htmlType="createTime"
                  name="createTime"
                  placeholder={'请输入'}
                  {...init('createTime', {})}
                />
              </FormItem>
            </Col>
          </Row>
        </Form>
      </Dialog>
    );
  }
}

export default EditBasicDialog;
