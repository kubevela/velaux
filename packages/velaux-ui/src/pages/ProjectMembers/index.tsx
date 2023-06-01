import { Table, Button, Pagination, Message, Dialog } from '@alifd/next';
import React, { Component, Fragment } from 'react';

import { getProjectRoles, getProjectUsers, deleteProjectUser } from '../../api/project';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { ProjectMember, ProjectRoleBase } from '@velaux/data';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';
import './index.less';

import MemberDialog from './components/MemberDialog';

type Props = {
  match: {
    params: {
      projectName: string;
    };
  };
};

type State = {
  page: number;
  pageSize: number;
  isLoading: boolean;
  memberList: ProjectMember[];
  projectRoles: ProjectRoleBase[];
  total: number;
  projectName: string;
  isMemberDialogVisible: boolean;
  isEditMember: boolean;
  editMember: ProjectMember;
};

class ProjectMembers extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      page: 0,
      pageSize: 10,
      total: 0,
      memberList: [],
      projectRoles: [],
      projectName: this.getProjectName(),
      editMember: {
        name: '',
        userRoles: [],
      },
      isLoading: false,
      isMemberDialogVisible: false,
      isEditMember: false,
    };
  }

  componentDidMount() {
    this.listMember();
    this.listProjectRoles();
  }

  listMember = async () => {
    const { projectName, page, pageSize } = this.state;
    const params = {
      projectName,
      page,
      pageSize,
    };
    this.setState({ isLoading: true });
    getProjectUsers(params)
      .then((res) => {
        this.setState({
          memberList: (res && res.users) || [],
          total: (res && res.total) || 0,
        });
      })
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  listProjectRoles = async () => {
    const { projectName } = this.state;
    const params = {
      projectName,
    };
    this.setState({ isLoading: true });
    getProjectRoles(params)
      .then((res) => {
        this.setState({
          projectRoles: (res && res.roles) || [],
        });
      })
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  getProjectName = () => {
    const { params = { projectName: '' } } = this.props.match;
    return params.projectName || '';
  };

  onEdit = (record: ProjectMember) => {
    this.onEditMember(record);
  };

  onCreate = () => {
    this.setState({
      isMemberDialogVisible: false,
    });
    this.listMember();
  };

  onDelete = (record: ProjectMember) => {
    Dialog.confirm({
      content: 'Are you sure you want to delete the member',
      onOk: () => {
        const { name, userRoles } = record;
        const { projectName } = this.state;
        const query = {
          userName: name,
          projectName,
        };

        if (name) {
          deleteProjectUser(query, { userRoles })
            .then((res) => {
              if (res) {
                Message.success(<Translation>Delete user success</Translation>);
                this.listMember();
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
      isMemberDialogVisible: false,
    });
  };

  onEditMember = (editMember: ProjectMember) => {
    this.setState({
      editMember: editMember,
      isEditMember: true,
      isMemberDialogVisible: true,
    });
  };

  handleClickCreate = () => {
    this.setState({
      isMemberDialogVisible: true,
      isEditMember: false,
    });
  };

  handleChange = (page: number) => {
    this.setState(
      {
        page,
      },
      () => {
        this.listMember();
      }
    );
  };

  render() {
    const { Column } = Table;
    const {
      memberList,
      projectName,
      isMemberDialogVisible,
      isEditMember,
      editMember,
      projectRoles,
      page,
      pageSize,
      total,
      isLoading,
    } = this.state;
    const columns = [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, item: ProjectMember) => {
          return (
            <span>
              {v}({item.alias || '-'})
            </span>
          );
        },
      },
      {
        key: 'userRoles',
        title: <Translation>UserRoles</Translation>,
        dataIndex: 'userRoles',
        cell: (v: string[]) => {
          return v.map((item: string) => (
            <span key={item} className="roles-permPolicies margin-right-5">
              {item}
            </span>
          ));
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
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: ProjectMember) => {
          return (
            <Fragment>
              <Permission
                request={{
                  resource: `project:${projectName}/projectUser:${record.name}`,
                  action: 'update',
                }}
                project={projectName}
              >
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
              <Permission
                request={{
                  resource: `project:${projectName}/projectUser:${record.name}`,
                  action: 'delete',
                }}
                project={projectName}
              >
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

    return (
      <Fragment>
        <div className="member-wrapper">
          <section className="member-create-btn">
            <Permission
              request={{ resource: `project:${projectName}/projectUser:*`, action: 'create' }}
              project={projectName}
            >
              <Button type="primary" onClick={this.handleClickCreate}>
                <Translation>Add Member</Translation>
              </Button>
            </Permission>
          </section>

          <section className="margin-top-20  member-list-wrapper">
            <Table locale={locale().Table} dataSource={memberList} loading={isLoading}>
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

            <If condition={isMemberDialogVisible}>
              <MemberDialog
                visible={isMemberDialogVisible}
                projectName={projectName}
                projectRoles={projectRoles}
                isEditMember={isEditMember}
                editMember={editMember}
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

export default ProjectMembers;
