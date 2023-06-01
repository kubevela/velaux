import { Table, Message, Dialog, Button } from '@alifd/next';
import React, { Component } from 'react';
import { AiFillDelete, AiFillSetting } from 'react-icons/ai';

import { deleteTarget } from '../../../../api/target';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import './index.less';
import type { Project , Target } from '@velaux/data';
import { locale } from '../../../../utils/locale';

import { Link } from 'dva/router';

type Props = {
  list?: [];
  updateTargetList: () => void;
  changeISEdit: (param: boolean, record: Target) => void;
};

class TableList extends Component<Props> {
  onDelete = (record: Target) => {
    deleteTarget({ name: record.name || '' }).then((re) => {
      if (re) {
        Message.success('target delete success');
        this.props.updateTargetList();
      }
    });
  };

  onEdit = (record: Target) => {
    this.props.changeISEdit(true, record);
  };

  getColumns = () => {
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
        cell: (v: Project) => {
          if (v && v.name) {
            return <Link to={`/projects/${v.name}/summary`}>{v && v.name}</Link>;
          } else {
            return null;
          }
        },
      },
      {
        key: 'clusterName/namespace',
        title: <Translation>Cluster/Namespace</Translation>,
        dataIndex: 'clusterName/CloudProvider',
        cell: (v: string, i: number, record: Target) => {
          return (
            <span>
              {record?.clusterAlias ? record?.clusterAlias : record?.cluster?.clusterName}/{record?.cluster?.namespace}
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
        width: '200px',
        cell: (v: string, i: number, record: Target) => {
          return (
            <div>
              <Permission request={{ resource: `target:${record.name}`, action: 'update' }} project={''}>
                <Button
                  text={true}
                  component={'a'}
                  size={'medium'}
                  className="margin-left-10"
                  onClick={() => {
                    this.onEdit(record);
                  }}
                >
                  <AiFillSetting />
                  <Translation>Edit</Translation>
                </Button>
                <span className="line" />
              </Permission>
              <Permission request={{ resource: `target:${record.name}`, action: 'delete' }} project={''}>
                <Button
                  text={true}
                  component={'a'}
                  size={'medium'}
                  className="danger-btn"
                  onClick={() => {
                    Dialog.confirm({
                      type: 'confirm',
                      content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
                      onOk: () => {
                        this.onDelete(record);
                      },
                      locale: locale().Dialog,
                    });
                  }}
                >
                  <AiFillDelete />
                  <Translation>Remove</Translation>
                </Button>
              </Permission>
            </div>
          );
        },
      },
    ];
  };

  render() {
    const { Column } = Table;
    const columns = this.getColumns();
    const { list } = this.props;
    return (
      <div className="table-delivery-list margin-top-20">
        <Table
          locale={locale().Table}
          className="customTable"
          size="medium"
          style={{ minWidth: '1200px' }}
          dataSource={list}
          loading={false}
        >
          {columns.map((col) => (
            <Column {...col} key={col.key} align={'left'} />
          ))}
        </Table>
      </div>
    );
  }
}

export default TableList;
