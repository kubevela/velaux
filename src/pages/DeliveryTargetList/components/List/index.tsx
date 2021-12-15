import React, { Component } from 'react';
import { Table, Message, Dialog } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { deleteDeliveryTarget } from '../../../../api/target';
import './index.less';
import type { DeliveryTarget } from '../../../../interface/deliveryTarget';
import locale from '../../../../utils/locale';
import type { Project } from '../../../../interface/project';

type Props = {
  list?: [];
  updateDeliveryTargetList: () => void;
  changeISEdit: (pararms: boolean, record: DeliveryTarget) => void;
};

class TableList extends Component<Props> {
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
        key: 'project',
        title: <Translation>Project</Translation>,
        dataIndex: 'project',
        cell: (v: Project | undefined) => {
          if (v) {
            return <span>{v.alias || v.name}</span>;
          }
          return '';
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
                  Dialog.confirm({
                    type: 'confirm',
                    content: (
                      <Translation>
                        Unrecoverable after deletion. Are you sure you want to delete it?
                      </Translation>
                    ),
                    onOk: () => {
                      this.onDelete(record);
                    },
                    locale: locale.Dialog,
                  });
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
          locale={locale.Table}
          className="customTable"
          size="medium"
          dataSource={list}
          hasBorder={false}
          loading={false}
        >
          {columns && columns.map((col) => <Column {...col} key={col.key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default TableList;
