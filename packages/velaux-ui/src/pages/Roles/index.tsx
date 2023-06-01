import { Button, Dialog, Message, Pagination, Table } from '@alifd/next';
import React, { Component, Fragment } from 'react';

import { getPlatformPermissions } from '../../api/rbac';
import { deleteRole, getRoleList } from '../../api/roles';
import { If } from '../../components/If';
import { ListTitle as Title } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { Translation } from '../../components';
import type { PermissionBase, RolesBase } from '@velaux/data';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';
import './index.less';

import RolesDialog from './components/RolesDialog';

interface Props {
}

type State = {
  list: RolesBase[];
  total: number;
  page: number;
  pageSize: number;
  permissions: PermissionBase[];
  visible: boolean;
  isEditRole: boolean;
  editRoleItem: RolesBase;
  isLoading: boolean;
};

class Roles extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      list: [],
      total: 0,
      page: 1,
      pageSize: 10,
      permissions: [],
      visible: false,
      isEditRole: false,
      editRoleItem: { name: '' },
      isLoading: false,
    };
  }

  componentDidMount() {
    this.listRoles();
    this.listPermissions();
  }

  listRoles = async () => {
    this.setState({ isLoading: true });
    const { page, pageSize } = this.state;
    getRoleList({ page, pageSize })
      .then((res) => {
        this.setState({
          list: (res && res.roles) || [],
          total: (res && res.total) || 0,
          isLoading: false,
        });
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  };

  listPermissions = async () => {
    getPlatformPermissions().then((res) => {
      this.setState({
        permissions: (res && res) || [],
      });
    });
  };

  onEdit = (record: RolesBase) => {
    this.setState({
      visible: true,
      isEditRole: true,
      editRoleItem: record,
    });
  };

  onDelete = (record: RolesBase) => {
    Dialog.confirm({
      content: 'Are you sure you want to delete this role',
      onOk: () => {
        const { name } = record;
        if (name) {
          deleteRole({ name }).then((res) => {
            if (res) {
              Message.success(<Translation>Delete the role success</Translation>);
              this.listRoles();
            }
          });
        }
      },
      locale: locale().Dialog,
    });
  };

  onCreate = () => {
    this.setState({ visible: false });
    this.listRoles();
  };

  onCloseCreate = () => {
    this.setState({ visible: false });
  };

  handleClickCreate = () => {
    this.setState({
      visible: true,
      isEditRole: false,
    });
  };

  handleChange = (page: number) => {
    this.setState(
      {
        page,
      },
      () => {
        this.listRoles();
      }
    );
  };

  render() {
    const columns = [
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
        key: 'createTime',
        title: <Translation>Create Time</Translation>,
        dataIndex: 'createTime',
        cell: (v: string) => {
          return <span>{momentDate(v)}</span>;
        },
      },
      // {
      //   key: 'permPolicies',
      //   title: <Translation>PermPolicies</Translation>,
      //   dataIndex: 'permPolicies',
      //   cell: (v: any) => {
      //     return v.map((item: any) => (<span className='roles-permPolicies margin-right-5'>{item && item.name}</span>))
      //   },
      // },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: RolesBase) => {
          return (
            <Fragment>
              <Permission request={{ resource: `role:${record.name}`, action: 'update' }} project={''}>
                <Button
                  text
                  size={'medium'}
                  component={'a'}
                  onClick={() => {
                    this.onEdit(record);
                  }}
                >
                  <Translation>Edit</Translation>
                </Button>
              </Permission>

              <Permission request={{ resource: `role:${record.name}`, action: 'delete' }} project={''}>
                <Button
                  text
                  size={'medium'}
                  component={'a'}
                  onClick={() => {
                    this.onDelete(record);
                  }}
                >
                  <Translation>Delete</Translation>
                </Button>
              </Permission>
            </Fragment>
          );
        },
      },
    ];

    const { Column } = Table;
    const { list, page, pageSize, total, visible, isEditRole, editRoleItem, permissions, isLoading } = this.state;
    return (
      <Fragment>
        <div className="roles-list-content">
          <Title
            title="Platform Roles"
            subTitle="Assign permissions for resources such as clusters、targets、addons、projects and users"
            extButtons={[
              <Permission request={{ resource: 'role:*', action: 'create' }} project={''}>
                <Button type="primary" onClick={this.handleClickCreate}>
                  <Translation>New Role</Translation>
                </Button>
              </Permission>,
            ]}
          />
          <Table locale={locale().Table} dataSource={list} loading={isLoading}>
            {columns.map((col, key) => (
              <Column {...col} key={key} align={'left'} />
            ))}
          </Table>

          <Pagination
            className="margin-top-20 text-align-right"
            total={total}
            locale={locale().Pagination}
            size="medium"
            pageSize={pageSize}
            current={page}
            onChange={this.handleChange}
          />

          <If condition={visible}>
            <RolesDialog
              visible={visible}
              isEditRole={isEditRole}
              editRoleItem={editRoleItem}
              permissions={permissions}
              onCreate={this.onCreate}
              onCloseCreate={this.onCloseCreate}
            />
          </If>
        </div>
      </Fragment>
    );
  }
}

export default Roles;
