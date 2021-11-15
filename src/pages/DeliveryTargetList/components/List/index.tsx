import React, { Component } from 'react';
import { Table, Message } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { deleteDeliveryTarget } from '../../../../api/deliveryTarget';
import './index.less';

type Props = {
  list?: [];
  updateDeliveryTargetList: () => void;
  changeISEdit: (pararms: boolean, record: Record) => void;
};

type State = {};

export type Record = {
  id?: string;
  name?: string;
  alias?: string;
  namespace?: string;
  description?: string;
  kubernetes?: {
    clusterName?: string;
    namespace?: string;
  };
  cloud?: {
    providerName?: string;
    region?: string;
    zone?: string;
    vpcID?: string;
  };
};

class TableList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  onDelete = (record: Record) => {
    deleteDeliveryTarget({ name: record.name }).then((re) => {
      if (re) {
        Message.success('DeliveryTarget delete success');
        this.props.updateDeliveryTargetList();
      }
    });
  };

  onEdlt = (record: Record) => {
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
        key: 'clusterName',
        title: <Translation>Clusters</Translation>,
        dataIndex: 'clusterName',
        cell: (v: string, i: number, record: Record) => {
          const { kubernetes } = record;
          return <span> {kubernetes && kubernetes.clusterName} </span>;
        },
      },
      {
        key: 'providerName',
        title: <Translation>Cloud Service Provider</Translation>,
        dataIndex: 'providerName',
        cell: (v: string, i: number, record: Record) => {
          const { cloud } = record;
          return <span> {cloud && cloud.providerName} </span>;
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
        key: 'region',
        title: <Translation>Region</Translation>,
        dataIndex: 'region',
        cell: (v: string, i: number, record: Record) => {
          const { cloud } = record;
          return <span> {cloud && cloud.region} </span>;
        },
      },
      {
        key: 'zone',
        title: <Translation>Zone</Translation>,
        dataIndex: 'zone',
        cell: (v: string, i: number, record: Record) => {
          const { cloud } = record;
          return <span> {cloud && cloud.zone} </span>;
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: Record) => {
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
    console.log('list', list);
    return (
      <div className="table-delivery-list margin-top-20">
        <Table dataSource={list} hasBorder={false} loading={false}>
          {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default TableList;
