import React from 'react';
import {
  Message,
  Grid,
  Dialog,
  Form,
  Input,
  Field,
  Select,
} from '@b-design/ui';
import { addDeliveryTargetList, editDeliveryTargetList } from '../../../../constants';
import Group from '../../../../extends/Group';
import NameSpaceForm from '../../../ApplicationList/components/GeneralConfig/namespace-form';
import { checkName } from '../../../../utils/common';
import { createDeliveryTarget, updateDeliveryTarget } from '../../../../api/deliveryTarget';
import Translation from '../../../../components/Translation';


type Props = {
  isEdit: boolean;
  visible: boolean;
  clusterList?: [];
  namespaceList?: [];
  onOK: () => void;
  onClose: () => void;
  dispatch: ({ }) => {};
  t: (key: string) => {};
};

type State = {
};

class DeliveryDialog extends React.Component<Props, State> {
  field: Field;

  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
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
      const { name, alias, project, description, clusterName, namespace, providerName, region, zone, vpcID } = this.field.getValues();
      console.log('pppparams', this.field.getValues())
      const params = {
        name,
        alias,
        description,
        namespace: project,
        kubernetes: {
          clusterName,
          namespace,
        },
        cloud: {
          providerName,
          region,
          zone,
          vpcID
        }
      }

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
  }

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
    console.log(' isEdit:false', isEdit)
    return (
      <div>
        <Dialog
          style={{ width: '800px' }}
          className="add-delivery-wraper"
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
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Project</Translation>}>
                  <Input
                    name="project"
                    placeholder={t('Please enter').toString()}
                    {...init('project', {

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

              <Col span={12} style={{ padding: '0 8px' }}>
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
            <Group
              title={`Kubernetes ${t('Clusters Info')}`}
              hasToggleIcon
            >
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
                  <NameSpaceForm field={this.field} namespaceList={namespaceList} />
                </Col>
              </Row>
            </Group>

            <Group
              title={<Translation>Cloud Service Provider Information</Translation>}
              hasToggleIcon
            >
              <Row>
                <Col span={12} style={{ padding: '0 8px' }}>
                  <FormItem label={<Translation>Cloud Service Provider</Translation>} required>
                    <Select
                      className="select"
                      defaultValue='alibaba'
                      placeholder={t('Please chose').toString()}
                      disabled
                      {...init(`providerName`, {
                        initValue: 'alibaba',
                        rules: [
                          {
                            required: true,
                            message: 'Please chose',
                          },
                        ],
                      })}
                      dataSource={[]}
                    />
                  </FormItem>
                </Col>
                <Col span={12} style={{ padding: '0 8px' }}>
                  <FormItem label={<Translation>Region</Translation>}>
                    <Input
                      name="region"
                      placeholder={t('Please enter').toString()}
                      {...init('region', {

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
                      name="zone"
                      placeholder={t('Please enter').toString()}
                      {...init('zone', {

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
                  <FormItem label={"VPC"}>
                    <Input
                      name="vpcID"
                      placeholder={t('Please enter').toString()}
                      {...init('vpcID', {

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
          </Form>
        </Dialog>
      </div>
    );
  }
}

export default DeliveryDialog;
