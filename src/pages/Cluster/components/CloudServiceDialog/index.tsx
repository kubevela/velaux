import React from 'react';
import { Button, Dialog, Form, Input, Select, Field, Table, Message } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { If } from 'tsx-control-statements/components';
import {
  supplierList,
  cloudServerTitle,
  SUPPLIER,
  NEXTSTEP,
  Abutment,
  PLEASE_ENTER,
  PLEASE_CHOSE,
} from '../../../../constants';
import { checkName, ACKCLusterStatus } from '../../../../utils/common';
import { getCloudClustersList } from '../../../../api/cluster';
import './index.less';

type Props = {
  visible: boolean;
  cloudClusters: [];
  setVisible: (visible: boolean) => void;
  setCloudService: (isCloudService: boolean) => void;
  t: (key: string) => {};
  dispatch: ({}) => {};
};

type State = {
  page: number;
  pageSize: number;
  choseInput: boolean;
};
type Record = {
  id: string;
  description: string;
  icon: string;
  name: string;
  type: string;
  zone: string;
  status: string;
  apiServerURL: string;
  dashboardURL: string;
};

class CloudServiceDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      page: 1,
      pageSize: 10,
      choseInput: true,
    };
  }

  onClose = () => {
    this.props.setVisible(false);
    this.props.setCloudService(false);
    this.resetField();
  };

  onOk = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }

      const { provider, accessKeyID, accessKeySecret } = values;
      const { page, pageSize } = this.state;
      const params = {
        provider,
        accessKeyID: accessKeyID,
        accessKeySecret: accessKeySecret,
        page,
        pageSize,
      };
      this.props.dispatch({
        type: 'clusters/getCloudClustersList',
        payload: params,
        callback: () => {
          this.setState({ choseInput: false });
        },
      });
    });
  };

  resetField() {
    this.setState({
      choseInput: true,
    });
  }

  connectcloudCluster = (record: Record) => {
    const { id = '', description = '', icon = '', name = '' } = record;
    const { accessKeyID, accessKeySecret, provider } = this.field.getValues();
    const params = {
      provider,
      accessKeyID: accessKeyID,
      accessKeySecret: accessKeySecret,
      name,
      description,
      clusterID: id,
      icon,
    };

    new Promise((resolve, err) => {
      this.props.dispatch({
        type: 'clusters/connectcloudCluster',
        payload: {
          params,
          resolve,
        },
      });
    })
      .then((res) => {
        if (res) {
          Message.success({
            title: 'success,connect success',
            duration: 3000,
          });
        }
      })
      .then((err) => {});
  };

  render() {
    const init = this.field.init;
    const { t, visible, cloudClusters } = this.props;
    const { choseInput } = this.state;
    const { Column } = Table;
    const PLEASE_ENTER_PLACE_HOLD = t(PLEASE_ENTER).toString();
    const PLEASE_CHOSE_PLACE_HOLD = t(PLEASE_CHOSE).toString();
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 18,
      },
    };

    const columns = [
      {
        key: 'name',
        title: '集群名称',
        dataIndex: 'name',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'status',
        title: '状态',
        dataIndex: 'status',
        cell: (v: string) => {
          const findArr = ACKCLusterStatus.filter((item) => {
            return item.key == v;
          });
          return <span style={{ color: findArr[0].color || '' }}> {v} </span>;
        },
      },
      {
        key: 'apiServerURL',
        title: 'API地址',
        dataIndex: 'apiServerURL',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'type',
        title: '类型',
        dataIndex: 'type',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'zone',
        title: '区域',
        dataIndex: 'zone',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'operation',
        title: '操作',
        dataIndex: 'operation',
        cell: (v: string, i: number, record: Record) => {
          return (
            <Button
              text
              ghost={true}
              component={'a'}
              onClick={() => {
                this.connectcloudCluster(record);
              }}
            >
              {Abutment}
            </Button>
          );
        },
      },
    ];

    return (
      <React.Fragment>
        <Dialog
          className="dialog-cluoudService-wraper"
          title={cloudServerTitle}
          autoFocus={true}
          visible={visible}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
          footer={
            choseInput && (
              <Button type="primary" onClick={this.onOk}>
                {NEXTSTEP}
              </Button>
            )
          }
          footerAlign="center"
        >
          <If condition={choseInput}>
            <Form {...formItemLayout} field={this.field} className="cloud-server-wraper">
              <FormItem label={SUPPLIER} required={true}>
                <Select
                  mode="single"
                  size="large"
                  dataSource={supplierList}
                  placeholder={PLEASE_CHOSE_PLACE_HOLD}
                  className="item"
                  {...init('provider', {
                    rules: [
                      {
                        required: true,
                        message: 'content cannot be empty',
                      },
                    ],
                  })}
                />
              </FormItem>

              <FormItem label={'AccessKey'} required={true}>
                <Input
                  htmlType="accessKeyID"
                  name="accessKeyID"
                  placeholder={PLEASE_ENTER_PLACE_HOLD}
                  {...init('accessKeyID', {
                    rules: [
                      {
                        required: true,
                        message: 'content cannot be empty',
                      },
                    ],
                  })}
                />
              </FormItem>

              <FormItem label={'AccessKeySecret'} required={true}>
                <Input
                  htmlType="accessKeySecret"
                  name="accessKeySecret"
                  placeholder={PLEASE_ENTER_PLACE_HOLD}
                  {...init('accessKeySecret', {
                    rules: [
                      {
                        required: true,
                        message: 'content cannot be empty',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Form>
          </If>

          <If condition={!choseInput}>
            <Table dataSource={cloudClusters} hasBorder={false} loading={false}>
              {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
            </Table>
          </If>
        </Dialog>
      </React.Fragment>
    );
  }
}

export default withTranslation()(CloudServiceDialog);
