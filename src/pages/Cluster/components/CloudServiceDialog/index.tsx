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
import Translation from '../../../../components/Translation';
import {
  supplierList,
  cloudServerTitle,
  SUPPLIER,
  NEXTSTEP,
  Abutment,
} from '../../../../constants';
import './index.less';

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setCloudService: (isCloudService: boolean) => void;
  dispatch: ({}) => {};
};

type State = {
  supplierValue: string;
  AKValue: string;
  SKValue: string;
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
  constructor(props: Props) {
    super(props);
    this.state = {
      supplierValue: '',
      AKValue: '',
      SKValue: '',
      page: 0,
      pageSize: 20,
      choseInput: true,
    };
  }

  onClose = () => {
    this.props.setVisible(false);
    this.props.setCloudService(false);
    this.resetField();
  };
  onOk = () => {
    const { supplierValue, AKValue, SKValue, page, pageSize } = this.state;

    const params = {
      provider: supplierValue,
      page,
      pageSize,
      body: {
        accessKeyID: AKValue,
        accessKeySecret: SKValue,
      },
    };
    this.props.dispatch({
      type: 'clusters/getCloudClustersList',
      payload: params,
    });
    this.setState({ choseInput: false });
  };

  resetField() {
    this.setState({
      supplierValue: '',
      AKValue: '',
      SKValue: '',
      choseInput: true,
    });
  }

  handleChangeSupplier = (value: string) => {
    this.setState({ supplierValue: value });
  };

  handleChangeAKValue = (value: string) => {
    this.setState({ AKValue: value });
  };

  handleChangeSKValue = (value: string) => {
    this.setState({ SKValue: value });
  };

  renderInput = () => {
    const { Row, Col } = Grid;
    const { supplierValue, AKValue, SKValue } = this.state;
    return (
      <Row>
        <Col span="8">
          <span className="margin-right-15"> {SUPPLIER}</span>
          <Select
            mode="single"
            size="large"
            onChange={this.handleChangeSupplier}
            dataSource={supplierList}
            placeholder={''}
            className="item"
            value={supplierValue}
          />
        </Col>
        <Col span="8">
          <span className="margin-right-15"> AK</span>
          <Input value={AKValue} onChange={this.handleChangeAKValue} />
        </Col>
        <Col span="8">
          <span className="margin-right-15"> SK</span>
          <Input value={SKValue} onChange={this.handleChangeSKValue} />
        </Col>
      </Row>
    );
  };

  connectcloudCluster = (record: Record) => {
    const { clusterID = '', description = '', icon = '', name = '' } = record;
    const { AKValue, SKValue, supplierValue } = this.state;
    const params = {
      provider: supplierValue,
      body: {
        accessKeyID: AKValue,
        accessKeySecret: SKValue,
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
          API: '',
          title4: 'title4',
          title5: 'title5',
          date: '2021-01-01',
        },
        {
          name: '集群名称2',
          status: 'success',
          API: '',
          title4: 'title4',
          title5: 'title5',
          date: '2021-01-01',
        },
        {
          name: '集群名称3',
          status: 'fail',
          API: '',
          title4: 'title4',
          title5: 'title5',
          date: '2021-01-01',
        },
        {
          name: '集群名称4',
          status: 'success',
          API: '',
          title4: 'title4',
          title5: 'title5',
          date: '2021-01-01',
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
        key: 'API',
        title: 'API地址',
        dataIndex: 'API',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'title4',
        title: '标题4',
        dataIndex: 'title4',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'title5',
        title: '标题5',
        dataIndex: 'title5',
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

export default CloudServiceDialog;
