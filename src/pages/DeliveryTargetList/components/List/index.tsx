import React, { Component } from 'react';
import { Table, Message } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { deleteDeliveryTarget } from '../../../../api/deliveryTarget';
import './index.less';
import { DeliveryTarget } from '../../../../interface/deliveryTarget';

type Props = {
  list?: [];
  updateDeliveryTargetList: () => void;
  changeISEdit: (pararms: boolean, record: DeliveryTarget) => void;
};

type State = {};

class TableList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  onDelete = (record: DeliveryTarget) => {
    deleteDeliveryTarget({ name: record.name || '' }).then((re) => {
      if (re) {
        Message.success('DeliveryTarget delete success');
        this.props.updateDeliveryTargetList();
      }
    });
  };

  onEdlt = (record: DeliveryTarget) => {
    this.props.changeISEdit(true, record);
  };

  getCloumns = () => {
    return [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'alias',
        title: <Translation>Alias</Translation>,
        dataIndex: 'alias',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'namespace',
        title: <Translation>Project</Translation>,
        dataIndex: 'namespace',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'clusterName/namespace',
        title: <Translation>Cluster/Namespace</Translation>,
        dataIndex: 'clusterName/CloudProvider',
        cell: (v: string, i: number, record: DeliveryTarget) => {
          return (
            <span>
              {record?.cluster?.clusterName}/{record?.cluster?.namespace}
            </span>
          );
        },
      },
      {
        key: 'description',
        title: <Translation>Description</Translation>,
        dataIndex: 'description',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: DeliveryTarget) => {
          return (
            <div>
              <a
                onClick={() => {
                  this.onDelete(record);
                }}
              >
                <Translation>Remove</Translation>
              </a>
              <a
                className="margin-left-10"
                onClick={() => {
                  this.onEdlt(record);
                }}
              >
                <Translation>Edit</Translation>
              </a>
            </div>
          );
        },
      },
    ];
  };

  render() {
    const { Column } = Table;
    const columns = this.getCloumns();
    const { list } = this.props;
    return (
      <div className="table-delivery-list margin-top-20">
        <Table
          className="customTable"
          size="medium"
          dataSource={list}
          hasBorder={false}
          loading={false}
        >
          {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default TableList;
