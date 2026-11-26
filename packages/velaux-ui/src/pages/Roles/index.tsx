import { Button, Dialog, Message, Pagination, Table } from '@alifd/next';
import React, { Component, Fragment } from 'react';
import { RowAction } from '../../components/RowAction';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';

import { getPlatformPermissions } from '../../api/rbac';
import { createRole, deleteRole, getRoleList, updateRole } from '../../api/roles';
import { AliasName } from '../../components/AliasName';
import { If } from '../../components/If';
import { ListTitle as Title } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { Translation } from '../../components';
import RoleDialog from '../../components/RoleDialog';
import type { RoleValues } from '../../components/RoleDialog';
import { RoleAccessChips } from '../../components/RolePermissions';
import type { PermissionBase, RolesBase } from '@velaux/data';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';
import './index.less';

interface Props {}

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

  saveRole = (values: RoleValues, isEdit: boolean) => (isEdit ? updateRole(values) : createRole(values));

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
        width: 220,
        cell: (v: string, i: number, record: RolesBase) => <AliasName name={v} alias={record.alias} />,
      },
      {
        key: 'permissions',
        title: <Translation>Permissions</Translation>,
        dataIndex: 'permissions',
        cell: (v: RolesBase['permissions']) => <RoleAccessChips granted={v} permissions={this.state.permissions} />,
      },
      {
        key: 'createTime',
        title: <Translation>CreateTime</Translation>,
        dataIndex: 'createTime',
        width: 200,
        cell: (v: string) => <span>{momentDate(v)}</span>,
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        width: 120,
        cell: (v: string, i: number, record: RolesBase) => {
          return (
            <Fragment>
              <Permission request={{ resource: `role:${record.name}`, action: 'update' }} project={''}>
                <RowAction
                  icon={<AiOutlineEdit />}
                  label="Edit"
                  onClick={() => {
                    this.onEdit(record);
                  }}
                />
              </Permission>

              <Permission request={{ resource: `role:${record.name}`, action: 'delete' }} project={''}>
                <RowAction
                  icon={<AiOutlineDelete />}
                  label="Delete"
                  danger
                  onClick={() => {
                    this.onDelete(record);
                  }}
                />
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
            subTitle="Assign permissions for resources such as clusters, targets, addons, projects and users"
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
            <RoleDialog
              role={isEditRole ? editRoleItem : undefined}
              permissions={permissions}
              save={this.saveRole}
              onSaved={this.onCreate}
              onClose={this.onCloseCreate}
            />
          </If>
        </div>
      </Fragment>
    );
  }
}

export default Roles;
