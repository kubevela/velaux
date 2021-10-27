import React from 'react';
import {
  Button,
  Message,
  Grid,
  Dialog,
  Form,
  Input,
  Select,
  Upload,
  Field,
  Table,
} from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import {
  supplierList,
  cloudServerTitle,
  SUPPLIER,
  NEXTSTEP,
  Abutment,
  PLEASE_ENTER,
  PLEASE_CHOSE,
} from '../../../../constants';
import { startEndNotEmpty, urlRegular } from '../../../../utils/common';
import './index.less';

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setCloudService: (isCloudService: boolean) => void;
  t: (key: string) => {};
  dispatch: ({ }) => {};
};

type State = {
  page: number;
  pageSize: number;
  choseInput: boolean;
};
type Record = {
  clusterID: string;
  description: string;
  icon: string;
  name: string;
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

      console.log('cluster', values);
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
      });
      this.setState({ choseInput: false });
    });

  };

  resetField() {
    this.setState({
      choseInput: true,
    });
  }

  renderInput = () => {
    const { t } = this.props;
    const init = this.field.init;
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

    return (
      <Form {...formItemLayout} field={this.field} className='cloud-server-wraper'>
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
                  pattern: startEndNotEmpty,
                  message: 'content cannot be empty',
                },
              ],
            })}
          />
        </FormItem>

        <FormItem label={'accessKey'} required={true}>
          <Input
            htmlType="accessKeyID"
            name="accessKeyID"
            placeholder={PLEASE_ENTER_PLACE_HOLD}
            {...init('accessKeyID', {
              rules: [
                {
                  required: true,
                  pattern: startEndNotEmpty,
                  message: 'content cannot be empty',
                },
              ],
            })} />
        </FormItem>

        <FormItem label={'accessKeySecret'} required={true}>
          <Input
            htmlType="accessKeySecret"
            name="accessKeySecret"
            placeholder={PLEASE_ENTER_PLACE_HOLD}
            {...init('accessKeySecret', {
              rules: [
                {
                  required: true,
                  pattern: startEndNotEmpty,
                  message: 'content cannot be empty',
                },
              ],
            })} />
        </FormItem>

      </Form>

    );
  };

  connectcloudCluster = (record: Record) => {
    const { clusterID = '', description = '', icon = '', name = '' } = record;
    const { accessKeyID, accessKeySecret, provider } = this.field.getValues();
    const params = {
      provider,
      body: {
        accessKeyID: accessKeyID,
        accessKeySecret: accessKeySecret,
        clusterID,
        description,
        icon,
        name,
      },
    };
    this.props.dispatch({
      type: 'clusters/connectcloudCluster',
      payload: params,
    });
  };

  renderTable = () => {
    const { Column } = Table;
    const dataSource = (i: number, j: number) => {
      return [
        {
          name: '集群名称1',
          status: 'success',
          apiServerURL: '',
          date: '2021-01-01',
          type: 'Kubernetes',
          zone: 'us-west-1a'
        },
        {
          name: '集群名称2',
          status: 'success',
          apiServerURL: '',
          date: '2021-01-01',
          type: 'Kubernetes',
          zone: 'us-west-1a'
        },
        {
          name: '集群名称3',
          status: 'fail',
          apiServerURL: '',
          date: '2021-01-01',
          type: 'Kubernetes',
          zone: 'us-west-1a'
        },
        {
          name: '集群名称4',
          status: 'success',
          apiServerURL: '',
          date: '2021-01-01',
          type: 'Kubernetes',
          zone: 'us-west-1a'
        },
      ];
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
        cell: (v: number) => {
          return <span>{v}</span>;
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
      <div>
        <Table dataSource={dataSource(10, 10)} hasBorder={false} loading={false}>
          {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>
      </div>
    );
  };

  render() {
    const { visible } = this.props;
    const { choseInput } = this.state;

    return (
      <div>
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
          {choseInput && this.renderInput()}
          {!choseInput && this.renderTable()}
        </Dialog>
      </div>
    );
  }
}


export default withTranslation()(CloudServiceDialog);
