import React from 'react';
import { Button, Dialog, Form, Input, Select, Field, Table, Message } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { If } from 'tsx-control-statements/components';
import { ACKCLusterStatus } from '../../../../utils/common';
import { getCloudClustersList } from '../../../../api/cluster';
import './index.less';
import { handleError } from '../../../../utils/errors';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setCloudService: (isCloudService: boolean) => void;
  t: (key: string) => string;
  onPropsOK: () => void;
  dispatch: ({ }) => void;
};

type State = {
  page: number;
  pageSize: number;
  choseInput: boolean;
  cloudClusters: [];
  btnLoading: boolean;
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
      cloudClusters: [],
      btnLoading: false,
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
      this.setState({ btnLoading: true });
      const { provider, accessKeyID, accessKeySecret } = values;
      const { page, pageSize } = this.state;
      const params = {
        provider,
        accessKeyID: accessKeyID,
        accessKeySecret: accessKeySecret,
        page,
        pageSize,
        customError: true,
      };
      getCloudClustersList(params)
        .then((re) => {
          if (re) {
            this.setState({ choseInput: false, cloudClusters: re.clusters, btnLoading: false });
            this.props.onPropsOK();
          }
        })
        .catch((err) => {
          this.setState({ btnLoading: false });
          handleError(err);
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
      alias: name,
      name: id.substring(0, 16),
      description,
      clusterID: id,
      icon,
    };

    new Promise((resolve) => {
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
      .then(() => { });
  };

  render() {
    const init = this.field.init;
    const { visible } = this.props;
    const { choseInput, cloudClusters, btnLoading } = this.state;
    const { Column } = Table;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 8,
      },
      wrapperCol: {
        span: 16,
      },
    };

    const columns = [
      {
        key: 'name',
        title: <Translation>Cluster Name</Translation>,
        dataIndex: 'name',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'status',
        title: <Translation>Cluster Status</Translation>,
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
        title: <Translation>API Address</Translation>,
        dataIndex: 'apiServerURL',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'type',
        title: <Translation>Type</Translation>,
        dataIndex: 'type',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'zone',
        title: <Translation>Zone</Translation>,
        dataIndex: 'zone',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
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
              <Translation>Connect</Translation>
            </Button>
          );
        },
      },
    ];

    const providerList = [{ value: 'aliyun', label: 'Aliyun ACK' }];

    return (
      <React.Fragment>
        <Dialog
          locale={locale.Dialog}
          className="dialog-cluoudService-wraper"
          title={<Translation>Connect Kubernetes Cluster From Cloud</Translation>}
          autoFocus={true}
          visible={visible}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
          footer={
            choseInput && (
              <Button type="primary" onClick={this.onOk} loading={btnLoading}>
                <Translation>Next Step</Translation>
              </Button>
            )
          }
          footerAlign="center"
        >
          <If condition={choseInput}>
            <Message style={{ marginBottom: '16px' }}>
              <Translation>
                KubeVela does not save your AK/SK, but does recommend allocating the smallest
                available permission set.
              </Translation>
            </Message>
            <Form {...formItemLayout} field={this.field} className="cloud-server-wraper">
              <FormItem label={<Translation>Provider</Translation>} required={true}>
                <Select
                  locale={locale.Select}
                  mode="single"
                  size="large"
                  dataSource={providerList}
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
                  htmlType="password"
                  name="accessKeyID"
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
                  htmlType="password"
                  name="accessKeySecret"
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
            <Table
              locale={locale.Table}
              dataSource={cloudClusters}
              hasBorder={false}
              loading={false}
            >
              {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
            </Table>
          </If>
        </Dialog>
      </React.Fragment>
    );
  }
}

export default withTranslation()(CloudServiceDialog);
