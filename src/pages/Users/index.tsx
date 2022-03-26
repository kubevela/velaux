import React, { Component, Fragment } from 'react';
import { Table, Button, Pagination, Message, Dialog } from '@b-design/ui';
import type { User } from '../../interface/user';
import type { RolesBase } from '../../interface/roles';
import type { NameAlias } from '../../interface/env';
import Translation from '../../components/Translation';
import locale from '../../utils/locale';
import { If } from 'tsx-control-statements/components';
import Title from '../../components/ListTitle';
import CreateUser from './components/CreateUser';
import ResetPassWordDialog from './components/ResetPassWordDialog';
import { getUserList, deleteUser, changeUserDisable, changeUserEnable } from '../../api/users';
import { getRoleList } from '../../api/roles';
import { momentDate } from '../../utils/common';
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
  isResetPassWordDialog: boolean;
};

class Users extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isUserDialogVisible: false,
      name: '',
      email: '',
      alias: '',
      page: 0,
      pageSize: 10,
      isLoading: false,
      total: 0,
      dataSource: [],
      rolesList: [],
      isEditUser: false,
      isResetPassword: false,
      isResetPassWordDialog: false,
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
        this.setState({
          dataSource: res.users || [],
          total: res.total,
        });
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
      },
    );
  };

  handleChangAlias(e: string) {
    this.setState(
      {
        alias: e,
      },
      () => {
        this.listUser();
      },
    );
  }

  handleChangEmail(e: string) {
    this.setState(
      {
        email: e,
      },
      () => {
        this.listUser();
      },
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

  onResetPassWordCreat = () => {
    this.setState({
      isResetPassWordDialog: false,
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
      locale: locale.Dialog,
    });
  };

  onClose = () => {
    this.setState({
      isUserDialogVisible: false,
    });
  };

  onResetPassWordClose = () => {
    this.setState({
      isResetPassWordDialog: false,
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
      isResetPassWordDialog: true,
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
        pageSize: 10,
      },
      () => {
        this.listUser();
      },
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
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: User) => {
          return (
            <Fragment>
              <Button
                text
                size={'medium'}
                ghost={true}
                component={'a'}
                onClick={() => {
                  this.onResetPassword(record);
                }}
              >
                <Translation>ResetPassWord</Translation>
              </Button>

              <Button
                text
                size={'medium'}
                ghost={true}
                component={'a'}
                onClick={() => {
                  this.onEdit(record);
                }}
              >
                <Translation>Edit</Translation>
              </Button>

              <Button
                text
                size={'medium'}
                ghost={true}
                component={'a'}
                onClick={() => {
                  this.onChangeStatus(record);
                }}
              >
                {this.isDisabledShow(record)}
              </Button>

              <Button
                text
                size={'medium'}
                ghost={true}
                component={'a'}
                onClick={() => {
                  this.onDelete(record);
                }}
              >
                <Translation>Delete</Translation>
              </Button>
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
      isResetPassWordDialog,
      isResetPassword,
      rolesList,
    } = this.state;
    return (
      <Fragment>
        <div className="user-wrapper">
          <section>
            <Title
              title="Users"
              subTitle="Provides basic management capabilities for local users, but SSO authentication is recommended"
              extButtons={[
                <Button type="primary" onClick={this.handleClickCreate}>
                  <Translation>New User</Translation>
                </Button>,
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
            <Table
              locale={locale.Table}
              dataSource={dataSource}
              hasBorder={false}
              loading={isLoading}
            >
              {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
            </Table>

            <Pagination
              className="margin-top-20 text-align-right"
              total={total}
              locale={locale.Pagination}
              hideOnlyOnePage={true}
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

            <If condition={isResetPassWordDialog}>
              <ResetPassWordDialog
                visible={isResetPassWordDialog}
                editUser={editUser}
                isResetPassword={isResetPassword}
                onClose={this.onResetPassWordClose}
                onCreate={this.onResetPassWordCreat}
              />
            </If>
          </section>
        </div>
      </Fragment>
    );
  }
}

export default Users;
