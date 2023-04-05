import { Button, Dialog, Form, Input, Select, Field, Table, Message, Pagination } from '@alifd/next';
import React from 'react';

import { getCloudClustersList } from '../../../../api/cluster';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import { ACKClusterStatus } from '../../../../utils/common';
import { handleError } from '../../../../utils/errors';
import { locale } from '../../../../utils/locale';

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setCloudService: (isCloudService: boolean) => void;
  onPropsOK: () => void;
  dispatch: ({}) => void;
};

type State = {
  page: number;
  pageSize: number;
  choseInput: boolean;
  cloudClusters: [];
  btnLoading: boolean;
  tableLoading: boolean;
  total: number;
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

type AccessKey = {
  accessKeyID: string;
  accessKeySecret: string;
  provider: string;
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
      tableLoading: false,
      total: 0,
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
            this.setState({
              choseInput: false,
              cloudClusters: re.clusters,
              btnLoading: false,
              total: re.total,
            });
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

  connectCloudCluster = (record: Record) => {
    const { id = '', description = '', icon = '', name = '' } = record;
    const { accessKeyID, accessKeySecret, provider } = this.field.getValues<AccessKey>();
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
      .then(() => {});
  };

  handleChange = (pageIdx: number) => {
    this.setState(
      {
        page: pageIdx,
      },
      () => {
        const { provider, accessKeyID, accessKeySecret } = this.field.getValues<AccessKey>();
        const { page, pageSize } = this.state;
        const params = {
          provider,
          accessKeyID: accessKeyID,
          accessKeySecret: accessKeySecret,
          page,
          pageSize,
          customError: true,
        };
        this.setState({ tableLoading: true });
        getCloudClustersList(params)
          .then((res) => {
            if (res) {
              this.setState({
                choseInput: false,
                cloudClusters: res.clusters,
                tableLoading: false,
                total: res.total,
              });
            }
          })
          .catch((err) => {
            this.setState({ tableLoading: false });
            handleError(err);
          });
      }
    );
  };

  render() {
    const init = this.field.init;
    const { visible } = this.props;
    const { choseInput, cloudClusters, btnLoading, total, tableLoading } = this.state;
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
          const findArr = ACKClusterStatus.filter((item) => {
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
            <Permission request={{ resource: 'cluster:*', action: 'create' }} project={''}>
              <Button
                text
                component={'a'}
                onClick={() => {
                  this.connectCloudCluster(record);
                }}
              >
                <Translation>Connect</Translation>
              </Button>
            </Permission>
          );
        },
      },
    ];

    const providerList = [{ value: 'aliyun', label: 'Aliyun ACK' }];
    const notice =
      "KubeVela won't save your AK/SK and we strongly recommend allocating the smallest available permission set";
    return (
      <React.Fragment>
        <Dialog
          locale={locale().Dialog}
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
          v2
        >
          <If condition={choseInput}>
            <Message style={{ marginBottom: '16px' }}>
              <Translation>{notice}</Translation>
            </Message>
            <Form {...formItemLayout} field={this.field} className="cloud-server-wrapper">
              <FormItem label={<Translation>Provider</Translation>} required={true}>
                <Select
                  locale={locale().Select}
                  mode="single"
                  size="large"
                  dataSource={providerList}
                  className="item"
                  {...init('provider', {
                    rules: [
                      {
                        required: true,
                        message: <Translation>content cannot be empty</Translation>,
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
                        message: <Translation>content cannot be empty</Translation>,
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
                        message: <Translation>content cannot be empty</Translation>,
                      },
                    ],
                  })}
                />
              </FormItem>
            </Form>
          </If>

          <If condition={!choseInput}>
            <Table locale={locale().Table} dataSource={cloudClusters} loading={tableLoading}>
              {columns.map((col, key) => (
                <Column {...col} key={key} align={'left'} />
              ))}
            </Table>
            <Pagination
              locale={locale().Pagination}
              hideOnlyOnePage={true}
              total={total}
              size="small"
              className="cluster-cloud-pagination-wrapper"
              pageSize={this.state.pageSize}
              current={this.state.page}
              onChange={this.handleChange}
            />
          </If>
        </Dialog>
      </React.Fragment>
    );
  }
}

export default CloudServiceDialog;
