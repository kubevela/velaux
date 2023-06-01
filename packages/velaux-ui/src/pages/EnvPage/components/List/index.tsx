import { ColumnProps } from '@alifd/next/types/table';
import { Table, Message, Dialog, Tag, Button } from '@alifd/next';
import { Link } from 'dva/router';
import React, { Component } from 'react';
import { AiFillDelete, AiFillSetting } from 'react-icons/ai';

import { deleteEnv } from '../../../../api/env';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import './index.less';
import type { Env, NameAlias , Project , LoginUserInfo } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import { checkPermission } from '../../../../utils/permission';
const { Group: TagGroup } = Tag;

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
        title: <Translation>Name(Alias)</Translation>,
        dataIndex: 'name',
        width: '200px',
        cell: (v: string, i: number, env: Env) => {
          return (
            <a
              onClick={() => {
                this.showEnvAppList(v);
              }}
            >
              {`${env.name}(${env.alias || '-'})`}
            </a>
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
            <TagGroup>
              {v?.map((target: NameAlias) => {
                return (
                  <Tag color="green" key={target.name + i}>
                    <If
                      condition={checkPermission(
                        { resource: `target:*`, action: 'list' },
                        record.project.name,
                        this.props.userInfo
                      )}
                    >
                      <Link to="/targets">{target.alias ? target.alias : target.name}</Link>
                    </If>
                    <If
                      condition={
                        !checkPermission(
                          { resource: `target:*`, action: 'list' },
                          record.project.name,
                          this.props.userInfo
                        )
                      }
                    >
                      {target.alias ? target.alias : target.name}
                    </If>
                  </Tag>
                );
              })}
            </TagGroup>
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
                <Button
                  className="margin-left-10"
                  text={true}
                  component={'a'}
                  size={'medium'}
                  onClick={() => {
                    this.onEdit(record);
                  }}
                >
                  <AiFillSetting />
                  <Translation>Edit</Translation>
                </Button>
                <span className="line" />
              </Permission>
              <Permission
                request={{
                  resource: `project:${record.project.name}/environment:${record.name}`,
                  action: 'delete',
                }}
                project={record.project.name}
              >
                <Button
                  text={true}
                  component={'a'}
                  size={'medium'}
                  className={'danger-btn'}
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
