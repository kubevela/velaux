import React, { Component, Fragment } from 'react';
import { Table, Button, Pagination } from '@b-design/ui';
import { User } from '../../interface/user';
import Translation from '../../components/Translation';
import locale from '../../utils/locale';
import { If } from 'tsx-control-statements/components';
import Title from '../../components/ListTitle';
import CreateUser from './components/CreateUser';
import { getUserList } from '../../api/users';
import './index.less';

type Props = {};

type State = {
  query: string;
  page: number;
  pageSize: number;
  isLoading: boolean;
  dataSource: [];
  total: number;
  isUserDialogVisible: boolean;
  isEditUser: boolean;
  editUser: User;
};

class Users extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isUserDialogVisible: false,
      query: '',
      page: 0,
      pageSize: 10,
      isLoading: false,
      total: 0,
      dataSource: [],
      isEditUser: false,
      editUser: {
        name: '',
        email: '',
        enable: false,
      },
    };
  }

  componentDidMount() {
    this.listUser();
  }

  listUser = async () => {
    const { query, page, pageSize } = this.state;
    const params = {
      query,
      page,
      pageSize,
    };
    this.setState({ isLoading: true });
    getUserList(params)
      .then((res) => {
        this.setState({
          dataSource: res.data.list,
        });
      })
      .catch(() => {})
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  onEdit = (record: User) => {
    this.onEditUser(record);
  };
  //Todo
  onCreate = () => {
    this.setState({
      isUserDialogVisible: false,
    });
  };

  //Todo
  onAble = () => {};
  //Todo
  onDelete = () => {};
  onClose = () => {
    this.setState({
      isUserDialogVisible: false,
    });
  };

  onEditUser = (editUser: User) => {
    this.setState({
      editUser: editUser,
      isEditUser: true,
      isUserDialogVisible: true,
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
    if (record.enable) {
      return <Translation>Disable</Translation>;
    } else {
      return <Translation>Enable</Translation>;
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
          return <span>{v}</span>;
        },
      },
      {
        key: 'lastLoginTime',
        title: <Translation>LastLoginTime</Translation>,
        dataIndex: 'lastLoginTime',
        cell: (v: string) => {
          return <span>{v}</span>;
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
                  this.onAble();
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
                  this.onDelete();
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
      dataSource,
      isUserDialogVisible,
      isEditUser,
      editUser,
      page,
      pageSize,
      total,
      isLoading,
    } = this.state;
    return (
      <Fragment>
        <div className="user-wrapper">
          <section>
            <Title
              title="Users"
              subTitle="Provides basic management capabilities for local users, but SSO authentication is strongly recommended."
              extButtons={[
                <Button type="primary" onClick={this.handleClickCreate}>
                  <Translation>New User</Translation>
                </Button>,
              ]}
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
                onClose={this.onClose}
                onCreate={this.onCreate}
              />
            </If>
          </section>
        </div>
      </Fragment>
    );
  }
}

export default Users;
