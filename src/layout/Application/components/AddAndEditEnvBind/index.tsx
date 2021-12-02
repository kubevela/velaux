import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'dva';
import { Dialog, Field, Form, Grid, Input, Message, Select, Button } from '@b-design/ui';
import type { ApplicationDetail } from '../../../../interface/application';
import { createApplicationEnv, updateApplicationEnv } from '../../../../api/application';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import { getDeliveryTarget } from '../../../../api/deliveryTarget';
import type { DeliveryTarget } from '../../../../interface/deliveryTarget';
import type { EnvBinding } from '../../../../interface/application';

interface Props {
  onClose: () => void;
  onOK: () => void;
  applicationDetail?: ApplicationDetail;
  editEnvBinding?: EnvBinding;
}

interface State {
  loading: boolean;
  targetList?: DeliveryTarget[];
  isEdit: boolean;
}

@connect((store: any) => {
  return { ...store.application };
})
class EnvBindPlanDialog extends Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
      isEdit: false,
    };
  }

  componentDidMount() {
    this.loadDeliveryTargets();
    this.getIsEdit();
  }

  loadDeliveryTargets = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      getDeliveryTarget({ namespace: applicationDetail?.namespace, page: 0 }).then((re) => {
        this.setState({ targetList: re.deliveryTargets });
      });
    }
  };

  getIsEdit = () => {
    if (this.props.editEnvBinding?.name) {
      this.setState({ isEdit: true }, this.setFields);
    }
    return;
  };

  setFields = () => {
    if (this.state.isEdit) {
      const { name, alias, description, targetNames } = this.props.editEnvBinding || {};
      this.field.setValues({
        name,
        alias,
        description,
        targetNames,
      });
    }
    return;
  };

  onSubmit = () => {
    const { applicationDetail } = this.props;
    const { isEdit } = this.state;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      this.setState({ loading: true });
      const { name, alias, description, targetNames } = values;
      const params = {
        appName: applicationDetail && applicationDetail.name,
        name,
        alias,
        targetNames,
        description,
      };
      if (isEdit) {
        this.onUpdateApplicationEnv(params);
        return;
      }
      this.onCreateApplicationEnv(params);
    });
  };

  onCreateApplicationEnv(params: any) {
    createApplicationEnv(params)
      .then((res) => {
        if (res) {
          Message.success(<Translation>Create Envbinding Success</Translation>);
          this.props.onOK();
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  onUpdateApplicationEnv(params: any) {
    updateApplicationEnv(params)
      .then((res) => {
        if (res) {
          Message.success(<Translation>Save Envbinding Success</Translation>);
          this.props.onOK();
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }
  render() {
    const { loading, targetList, isEdit } = this.state;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const init = this.field.init;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };
    return (
      <Dialog
        visible={true}
        className={'commonDialog'}
        style={{ width: '800px' }}
        footerActions={['ok']}
        onClose={this.props.onClose}
        footer={
          <Button type="primary" onClick={this.onSubmit} loading={loading}>
            {!isEdit ? <Translation>Submit</Translation> : <Translation>Save</Translation>}
          </Button>
        }
        title={<Translation>New Environment</Translation>}
      >
        <Form {...formItemLayout} field={this.field}>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Environment Name</Translation>} required={true}>
                <Input
                  htmlType="name"
                  name="name"
                  disabled={isEdit ? true : false}
                  maxLength={32}
                  {...init('name', {
                    rules: [
                      {
                        required: true,
                        pattern: checkName,
                        message: 'Please enter a valid env name',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>

            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Environment Alias</Translation>}>
                <Input
                  name="alias"
                  {...init('alias', {
                    rules: [
                      {
                        minLength: 2,
                        maxLength: 64,
                        message: 'Enter a string of 2 to 64 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Description</Translation>}>
                <Input
                  name="description"
                  placeholder={'A description of the environment.'}
                  {...init('description', {
                    rules: [
                      {
                        maxLength: 128,
                        message: 'Enter a description less than 128 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Targets</Translation>} required>
                <Select
                  name="targetNames"
                  mode="multiple"
                  placeholder={'Select the delivery target corresponding to the environment.'}
                  {...init('targetNames', {
                    rules: [
                      {
                        required: true,
                      },
                    ],
                  })}
                >
                  {targetList?.map((target) => {
                    return (
                      <Select.Option value={target.name}>
                        {target.alias || target.name}
                      </Select.Option>
                    );
                  })}
                </Select>
              </FormItem>
            </Col>
          </Row>
        </Form>
      </Dialog>
    );
  }
}

export default withTranslation()(EnvBindPlanDialog);
