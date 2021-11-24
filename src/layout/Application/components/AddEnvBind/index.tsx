import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'dva';
import { Dialog, Field, Form, Grid, Input, Message, Select, Button } from '@b-design/ui';
import type { ApplicationDetail } from '../../../../interface/application';
import { createApplicationEnv } from '../../../../api/application';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import { getDeliveryTarget } from '../../../../api/deliveryTarget';
import type { DeliveryTarget } from '../../../../interface/deliveryTarget';

interface Props {
  onClose: () => void;
  onOK: () => void;
  applicationDetail?: ApplicationDetail;
}

interface State {
  loading: boolean;
  targetList?: DeliveryTarget[];
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
    };
  }

  componentDidMount() {
    this.loadDeliveryTargets();
  }

  loadDeliveryTargets = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      getDeliveryTarget({ namespace: applicationDetail?.namespace, page: 0 }).then((re) => {
        this.setState({ targetList: re.deliveryTargets });
      });
    }
  };

  onSubmit = () => {
    const { applicationDetail } = this.props;
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
  render() {
    const { loading, targetList } = this.state;
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
            <Translation>Submit</Translation>
          </Button>
        }
        title={<Translation>Add Environment</Translation>}
      >
        <Form {...formItemLayout} field={this.field}>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Environment name</Translation>} required={true}>
                <Input
                  htmlType="name"
                  name="name"
                  maxLength={32}
                  placeholder={'environment name'}
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
              <FormItem label={<Translation>Environment alias</Translation>}>
                <Input
                  name="alias"
                  placeholder={'environment alias, you can type Chinese'}
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
              <FormItem label={<Translation>Delivery Target</Translation>} required>
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
