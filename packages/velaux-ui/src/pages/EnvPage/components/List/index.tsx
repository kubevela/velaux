import { ColumnProps } from '@alifd/next/types/table';
import { Table, Message, Dialog } from '@alifd/next';
import { Link } from 'dva/router';
import React, { Component } from 'react';
import { RowAction } from '../../../../components/RowAction';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';

import { deleteEnv } from '../../../../api/env';
import { AliasName } from '../../../../components/AliasName';
import { Chip } from '../../../../components/ResourceCard';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import './index.less';
import type { Env, NameAlias, Project, LoginUserInfo } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import { checkPermission } from '../../../../utils/permission';

type Props = {
  list?: Env[];
  updateEnvList: () => void;
  userInfo?: LoginUserInfo;
  changeISEdit: (param: boolean, record: Env) => void;
};

class TableList extends Component<Props> {
  onDelete = (record: Env) => {
    deleteEnv({ name: record.name || '' }).then((re) => {
      if (re) {
        Message.success('Environment deleted successfully');
        this.props.updateEnvList();
      }
    });
  };
  onEdit = (record: Env) => {
    this.props.changeISEdit(true, record);
  };

  showEnvAppList = (envName: string) => {
    this.setState({ showEnvAppList: true, envName: envName });
  };

  getColumns = (): Array<ColumnProps & { key: string }> => {
    return [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        width: '200px',
        cell: (v: string, i: number, env: Env) => {
          return (
            <AliasName
              name={env.name}
              alias={env.alias}
              onClick={() => {
                this.showEnvAppList(v);
              }}
            />
          );
        },
      },
      {
        key: 'project',
        title: <Translation>Project</Translation>,
        dataIndex: 'project',
        width: '100px',
        cell: (v: Project) => {
          if (v && v.name) {
            return <Link to={`/projects/${v.name}/summary`}>{v.alias || v.name}</Link>;
          } else {
            return null;
          }
        },
      },
      {
        key: 'namespace',
        title: <Translation>Namespace</Translation>,
        dataIndex: 'namespace',
        width: '120px',
        cell: (v: string) => {
          return <span>{v}</span>;
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
        key: 'targets',
        title: <Translation>Targets</Translation>,
        dataIndex: 'targets',
        cell: (v: NameAlias[], i: number, record: Env) => {
          return (
            <span className="env-list-targets">
              {v?.map((target: NameAlias) => {
                const label = target.alias ? target.alias : target.name;
                const canList = checkPermission(
                  { resource: `target:*`, action: 'list' },
                  record.project.name,
                  this.props.userInfo
                );
                return <Chip key={target.name + i}>{canList ? <Link to="/targets">{label}</Link> : label}</Chip>;
              })}
            </span>
          );
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        width: '200px',
        cell: (v: string, i: number, record: Env) => {
          return (
            <div>
              <Permission
                request={{
                  resource: `project:${record.project.name}/environment:${record.name}`,
                  action: 'update',
                }}
                project={record.project.name}
              >
                <RowAction
                  icon={<AiOutlineEdit />}
                  label="Edit"
                  onClick={() => {
                    this.onEdit(record);
                  }}
                />
              </Permission>
              <Permission
                request={{
                  resource: `project:${record.project.name}/environment:${record.name}`,
                  action: 'delete',
                }}
                project={record.project.name}
              >
                <RowAction
                  icon={<AiOutlineDelete />}
                  label="Remove"
                  danger
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
                />
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
      <div className="table-env-list margin-top-20">
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
