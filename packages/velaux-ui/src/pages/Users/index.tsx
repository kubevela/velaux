import { Table, Button, Pagination, Message, Dialog } from '@alifd/next';
import React, { Component, Fragment } from 'react';

import { getRoleList } from '../../api/roles';
import { getUserList, deleteUser, changeUserDisable, changeUserEnable } from '../../api/users';
import { If } from '../../components/If';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { NameAlias , RolesBase , User } from '@velaux/data';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';

import CreateUser from './components/CreateUser';
import ResetPassword from './components/ResetPassword';
import SelectSearch from './components/SelectSearch';

import './index.less';

type Props = {};

type State = {
  name: string;
  email: string;
  alias: string;
  page: number;
  pageSize: number;
  isLoading: boolean;
  dataSource: [];
  total: number;
  isUserDialogVisible: boolean;
  isEditUser: boolean;
  editUser: User;
  rolesList: RolesBase[];
  isResetPassword: boolean;
  isResetPasswordDialog: boolean;
};

class Users extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isUserDialogVisible: false,
      name: '',
      email: '',
      alias: '',
      page: 1,
      pageSize: 10,
      isLoading: false,
      total: 0,
      dataSource: [],
      rolesList: [],
      isEditUser: false,
      isResetPassword: false,
      isResetPasswordDialog: false,
      editUser: {
        name: '',
        email: '',
        disabled: false,
      },
    };
  }

  componentDidMount() {
    this.listUser();
    this.listRoles();
  }

  listUser = async () => {
    const { name, alias, email, page, pageSize } = this.state;
    const params = {
      name,
      email,
      alias,
      page,
      pageSize,
    };
    this.setState({ isLoading: true });
    getUserList(params)
      .then((res) => {
        if (res) {
          this.setState({
            dataSource: res.users || [],
            total: res.total,
          });
        }
      })
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  listRoles = async () => {
    getRoleList({}).then((res) => {
      this.setState({
        rolesList: (res && res.roles) || [],
      });
    });
  };

  handleChangName = (e: string) => {
    this.setState(
      {
        name: e,
      },
      () => {
        this.listUser();
      }
    );
  };

  handleChangAlias(e: string) {
    this.setState(
      {
        alias: e,
      },
      () => {
        this.listUser();
      }
    );
  }

  handleChangEmail(e: string) {
    this.setState(
      {
        email: e,
      },
      () => {
        this.listUser();
      }
    );
  }

  onEdit = (record: User) => {
    this.onEditUser(record);
  };

  onResetPassword = (record: User) => {
    this.onEditResetPasswordUser(record);
  };

  onCreate = () => {
    this.setState({
      isUserDialogVisible: false,
    });
    this.listUser();
  };

  onResetPassWord = () => {
    this.setState({
      isResetPasswordDialog: false,
    });
    this.listUser();
  };

  onChangeStatus = (record: User) => {
    const { disabled, name } = record;
    if (disabled) {
      changeUserEnable({ name })
        .then((res) => {
          if (res) {
            Message.success(<Translation>Update user status success</Translation>);
            this.listUser();
          }
        })
        .catch();
    } else {
      changeUserDisable({ name })
        .then((res) => {
          if (res) {
            Message.success(<Translation>Update user status success</Translation>);
            this.listUser();
          }
        })
        .catch();
    }
  };

  onDelete = (record: User) => {
    Dialog.confirm({
      content: 'Are you sure you want to delete the user',
      onOk: () => {
        const { name } = record;
        if (name) {
          deleteUser({ name })
            .then((res) => {
              if (res) {
                Message.success(<Translation>Delete user success</Translation>);
                this.listUser();
              }
            })
            .catch();
        }
      },
      locale: locale().Dialog,
    });
  };

  onClose = () => {
    this.setState({
      isUserDialogVisible: false,
    });
  };

  onResetPassWordClose = () => {
    this.setState({
      isResetPasswordDialog: false,
    });
  };

  onEditUser = (editUser: User) => {
    this.setState({
      editUser: editUser,
      isEditUser: true,
      isUserDialogVisible: true,
    });
  };

  onEditResetPasswordUser = (editUser: User) => {
    this.setState({
      editUser: editUser,
      isResetPasswordDialog: true,
      isResetPassword: true,
    });
  };

  handleClickCreate = () => {
    this.setState({
      isUserDialogVisible: true,
      isEditUser: false,
    });
  };

  handleChange = (page: number) => {
    this.setState(
      {
        page,
      },
      () => {
        this.listUser();
      }
    );
  };

  isDisabledShow = (record: User) => {
    if (record.disabled) {
      return <Translation>Enable</Translation>;
    } else {
      return <Translation>Disable</Translation>;
    }
  };

  render() {
    const { Column } = Table;
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
        key: 'roles',
        title: <Translation>Platform Roles</Translation>,
        dataIndex: 'roles',
        cell: (v: NameAlias[]) => {
          return (v || []).map((item: NameAlias) => (
            <span className="roles-permPolicies margin-right-5">{item.alias || item.name}</span>
          ));
        },
      },
      {
        key: 'email',
        title: <Translation>Email</Translation>,
        dataIndex: 'email',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'createTime',
        title: <Translation>CreateTime</Translation>,
        dataIndex: 'createTime',
        cell: (v: string) => {
          if (v) {
            return <span>{momentDate(v)}</span>;
          }
          return '';
        },
      },
      {
        key: 'lastLoginTime',
        title: <Translation>LastLoginTime</Translation>,
        dataIndex: 'lastLoginTime',
        cell: (v: string) => {
          if (v) {
            return <span>{momentDate(v)}</span>;
          }
          return '';
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: User) => {
          return (
            <Fragment>
              <Permission request={{ resource: `user:${record.name}`, action: 'update' }} project={''}>
                <Button
                  text
                  size={'medium'}
                  component={'a'}
                  onClick={() => {
                    this.onResetPassword(record);
                  }}
                >
                  <Translation>Reset Password</Translation>
                </Button>
              </Permission>
              <span className="line" />
              <Permission request={{ resource: `user:${record.name}`, action: 'update' }} project={''}>
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
              <span className="line" />
              <Permission
                request={{
                  resource: `user:${record.name}`,
                  action: record.disabled ? 'enable' : 'disable',
                }}
                project={''}
              >
                <Button
                  text
                  size={'medium'}
                  component={'a'}
                  onClick={() => {
                    this.onChangeStatus(record);
                  }}
                >
                  {this.isDisabledShow(record)}
                </Button>
              </Permission>
              <span className="line" />
              <Permission request={{ resource: `user:${record.name}`, action: 'delete' }} project={''}>
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

    const {
      name,
      alias,
      email,
      dataSource,
      isUserDialogVisible,
      isEditUser,
      editUser,
      page,
      pageSize,
      total,
      isLoading,
      isResetPasswordDialog,
      isResetPassword,
      rolesList,
    } = this.state;
    return (
      <Fragment>
        <div className="user-wrapper">
          <section>
            <ListTitle
              title="Users"
              subTitle="Basic authorization management is provided for local users by default, but SSO authentication is strongly recommended"
              extButtons={[
                <Permission request={{ resource: 'user:*', action: 'create' }} project={''}>
                  <Button type="primary" onClick={this.handleClickCreate}>
                    <Translation>New User</Translation>
                  </Button>
                  ,
                </Permission>,
              ]}
            />
          </section>

          <section>
            <SelectSearch
              name={name}
              alias={alias}
              email={email}
              handleChangName={(nameValue: string) => {
                this.handleChangName(nameValue);
              }}
              handleChangAlias={(aliasValue: string) => {
                this.handleChangAlias(aliasValue);
              }}
              handleChangEmail={(emailValue: string) => {
                this.handleChangEmail(emailValue);
              }}
            />
          </section>

          <section className="margin-top-20  user-list-wrapper">
            <Table locale={locale().Table} dataSource={dataSource} loading={isLoading}>
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

            <If condition={isUserDialogVisible}>
              <CreateUser
                visible={isUserDialogVisible}
                isEditUser={isEditUser}
                editUser={editUser}
                rolesList={rolesList}
                onClose={this.onClose}
                onCreate={this.onCreate}
              />
            </If>

            <If condition={isResetPasswordDialog}>
              <ResetPassword
                visible={isResetPasswordDialog}
                editUser={editUser}
                isResetPassword={isResetPassword}
                onClose={this.onResetPassWordClose}
                onCreate={this.onResetPassWord}
              />
            </If>
          </section>
        </div>
      </Fragment>
    );
  }
}

export default Users;
