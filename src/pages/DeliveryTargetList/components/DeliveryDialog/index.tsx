import React from 'react';
import { Message, Grid, Dialog, Form, Input, Field, Select } from '@b-design/ui';
import { addDeliveryTargetList, editDeliveryTargetList } from '../../../../constants';
import Group from '../../../../extends/Group';
import NameSpaceForm from '../../../ApplicationList/components/GeneralConfig/namespace-form';
import { checkName } from '../../../../utils/common';
import { createDeliveryTarget, updateDeliveryTarget } from '../../../../api/deliveryTarget';
import { DeliveryTarget } from '../../../../interface/deliveryTarget';
import Translation from '../../../../components/Translation';
import { Cluster } from '../../../../interface/cluster';

type Props = {
  isEdit: boolean;
  visible: boolean;
  clusterList?: Array<Cluster>;
  namespaceList?: [];
  deliveryTargetItem?: DeliveryTarget;
  onOK: () => void;
  onClose: () => void;
  dispatch: ({}) => {};
  t: (key: string) => {};
};

type State = {};

class DeliveryDialog extends React.Component<Props, State> {
  field: Field;

  constructor(props: Props) {
    super(props);
    this.field = new Field(this, {
      onChange: (name: string, value: any) => {
        if (name == 'clusterName') {
          props.clusterList?.map((cluster) => {
            if ((cluster.name == value, cluster.providerInfo)) {
              this.field.setValues({
                var_region: cluster.providerInfo.regionID,
                var_zone: cluster.providerInfo.zoneID,
                var_vpcID: cluster.providerInfo.vpcID,
              });
            }
          });
        }
      },
    });
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.isEdit && nextProps.deliveryTargetItem !== this.props.deliveryTargetItem) {
      const {
        name,
        alias,
        description,
        namespace,
        cluster = { clusterName: '', namespace: '' },
        variable = { providerName: '', region: '', zone: '', vpcID: '' },
      } = nextProps.deliveryTargetItem;
      this.field.setValues({
        name,
        alias,
        description,
        project: namespace,
        clusterName: cluster.clusterName,
        namespace: cluster.namespace,
        var_providerName: variable.providerName,
        var_region: variable.region,
        var_zone: variable.zone,
        var_vpcID: variable.vpcID,
      });
    }
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
      const { isEdit } = this.props;
      const {
        name,
        alias,
        description,
        clusterName,
        namespace,
        runtimeNamespace,
        var_providerName,
        var_region,
        var_zone,
        var_vpcID,
      } = this.field.getValues();
      const params = {
        name,
        alias,
        description,
        namespace,
        cluster: {
          clusterName,
          namespace: runtimeNamespace,
        },
        variable: {
          providerName: var_providerName,
          region: var_region,
          zone: var_zone,
          vpcID: var_vpcID,
        },
      };

      if (isEdit) {
        updateDeliveryTarget(params).then((res) => {
          if (res) {
            Message.success(<Translation>Update DeliveryTargetList Success</Translation>);
            this.props.onOK();
            this.onClose();
          }
        });
      } else {
        createDeliveryTarget(params).then((res) => {
          if (res) {
            Message.success(<Translation>Create DeliveryTargetList Success</Translation>);
            this.props.onOK();
            this.onClose();
          }
        });
      }
    });
  };

  resetField() {
    this.field.setValues({
      name: '',
      alias: '',
      description: '',
      project: '',
      clusterName: '',
      namespace: '',
      providerName: '',
      region: '',
      zone: '',
      vpcID: '',
    });
  }

  transCluster = () => {
    const { clusterList } = this.props;
    return (clusterList || []).map((item: { name: string }) => ({
      lable: item.name,
      value: item.name,
    }));
  };

  render() {
    const { Col, Row } = Grid;
    const FormItem = Form.Item;
    const init = this.field.init;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 18,
      },
    };

    const { t, visible, isEdit, namespaceList = [] } = this.props;

    return (
      <div>
        <Dialog
          style={{ width: '800px' }}
          height="auto"
          title={isEdit ? editDeliveryTargetList : addDeliveryTargetList}
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
                <FormItem label={<Translation>Name</Translation>} required>
                  <Input
                    name="name"
                    disabled={isEdit}
                    placeholder={t('Please enter').toString()}
                    {...init('name', {
                      rules: [
                        {
                          required: true,
                          pattern: checkName,
                          message: 'Please enter a valid English name',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Alias</Translation>}>
                  <Input
                    name="alias"
                    placeholder={t('Please enter').toString()}
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
                <NameSpaceForm field={this.field} namespaceList={namespaceList} />
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Description</Translation>}>
                  <Input
                    name="description"
                    placeholder={t('Please enter').toString()}
                    {...init('description', {
                      rules: [
                        {
                          maxLength: 256,
                          message: 'Enter a description that contains less than 256 characters.',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Cluster Screening</Translation>} required>
                  <Select
                    className="select"
                    placeholder={t('Please chose').toString()}
                    {...init(`clusterName`, {
                      rules: [
                        {
                          required: true,
                          message: 'Please chose',
                        },
                      ],
                    })}
                    dataSource={this.transCluster()}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem
                  label={<Translation>Cluster Namesapce</Translation>}
                  help="If left blank, the namespace is automatically created"
                >
                  <Input
                    name="runtimeNamespace"
                    placeholder={t('Please enter').toString()}
                    {...init('runtimeNamespace', {
                      rules: [
                        {
                          maxLength: 256,
                          message: 'Specify a correct namespace in the cluster',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <Group
                  title={<Translation>Shared Variables</Translation>}
                  required={false}
                  description={'You can define parameters such as region and zone.'}
                  hasToggleIcon
                >
                  <Row>
                    <Col span={12} style={{ padding: '0 8px' }}>
                      <FormItem label={<Translation>Cloud Service Provider</Translation>}>
                        <Select
                          className="select"
                          defaultValue="alibaba"
                          placeholder={t('Please chose').toString()}
                          {...init(`var_providerName`)}
                          dataSource={[]}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12} style={{ padding: '0 8px' }}>
                      <FormItem label={<Translation>Region</Translation>}>
                        <Input
                          name="var_region"
                          placeholder={t('Please enter').toString()}
                          {...init('var_region', {
                            rules: [
                              {
                                maxLength: 256,
                                message: 'Enter a Region.',
                              },
                            ],
                          })}
                        />
                      </FormItem>
                    </Col>
                  </Row>

                  <Row>
                    <Col span={12} style={{ padding: '0 8px' }}>
                      <FormItem label={<Translation>Zone</Translation>}>
                        <Input
                          name="var_zone"
                          placeholder={t('Please enter').toString()}
                          {...init('var_zone', {
                            rules: [
                              {
                                maxLength: 256,
                                message: 'Enter a Zone.',
                              },
                            ],
                          })}
                        />
                      </FormItem>
                    </Col>

                    <Col span={12} style={{ padding: '0 8px' }}>
                      <FormItem label={'VPC'}>
                        <Input
                          name="var_vpcID"
                          placeholder={t('Please enter').toString()}
                          {...init('var_vpcID', {
                            rules: [
                              {
                                maxLength: 256,
                                message: 'Enter a VPC',
                              },
                            ],
                          })}
                        />
                      </FormItem>
                    </Col>
                  </Row>
                </Group>
              </Col>
            </Row>
          </Form>
        </Dialog>
      </div>
    );
  }
}

export default DeliveryDialog;
