import React, { Fragment, Component } from 'react';
import { Link } from 'dva/router';
import { getProjectList, deleteProject } from '../../api/project';
import { getUserList } from '../../api/users';
import type { Project } from '../../interface/project';
import type { NameAlias } from '../../interface/env';
import type { User } from '../../interface/user';
import { Table, Button, Pagination, Dialog, Message } from '@b-design/ui';
import Translation from '../../components/Translation';
import { momentDate } from '../../utils/common';
import locale from '../../utils/locale';
import CreateProjectDialog from './components/CreateProjectDialog';
import Title from '../../components/ListTitle';
import { If } from 'tsx-control-statements/components';
import './index.less';

type Props = {};

type State = {
  list: Project[];
  total: number;
  page: number;
  pageSize: number;
  visible: boolean;
  isEditProject: boolean;
  editProjectItem: Project;
  isLoading: boolean;
  userList: User[];
};

class Projects extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      list: [],
      total: 0,
      page: 0,
      pageSize: 10,
      visible: false,
      isEditProject: false,
      editProjectItem: { name: '' },
      isLoading: false,
      userList: [],
    };
  }
  componentDidMount() {
    this.listProjects();
    this.listUser();
  }

  listProjects = async () => {
    this.setState({ isLoading: true });
    const { page, pageSize } = this.state;
    getProjectList({ page, pageSize })
      .then((res) => {
        this.setState({
          list: res.projects || [],
          total: res.total || 0,
          isLoading: false,
        });
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  };

  listUser = async () => {
    const param = { name: '' };
    getUserList(param).then((res) => {
      if (res && res.users) {
        const userListData = (res.users || []).map((item: User) => ({
          label: item.name,
          value: item.name,
        }));
        this.setState({
          userList: userListData || [],
        });
      }
    });
  };

  onEdit = (record: Project) => {
    this.setState({
      visible: true,
      isEditProject: true,
      editProjectItem: record,
    });
  };

  onDelete = (record: Project) => {
    Dialog.confirm({
      content: 'Are you sure you want to delete the project',
      onOk: () => {
        const { name } = record;
        if (name) {
          deleteProject({ name })
            .then((res) => {
              if (res) {
                Message.success(<Translation>Delete project success</Translation>);
                this.listProjects();
              }
            })
            .catch();
        }
      },
      locale: locale.Dialog,
    });
  };

  onCreate = () => {
    this.setState({ visible: false });
    this.listProjects();
  };

  onCloseCreate = () => {
    this.setState({ visible: false });
  };

  handleClickCreate = () => {
    this.setState({
      visible: true,
      isEditProject: false,
    });
  };

  handleChange = (page: number) => {
    this.setState(
      {
        page,
        pageSize: 10,
      },
      () => {
        this.listProjects();
      },
    );
  };

  render() {
    const columns = [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string) => {
          return (
            <span>
              <Link to={`/projects/${v}`}>{v}</Link>
            </span>
          );
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
        key: 'description',
        title: <Translation>Description</Translation>,
        dataIndex: 'description',
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
      {
        key: 'owner',
        title: <Translation>Owner</Translation>,
        dataIndex: 'owner',
        cell: (v: NameAlias) => {
          return <span>{v && v.alias ? `${v.alias}(${v.name})` : v.name}</span>;
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: any) => {
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

    const { Column } = Table;
    const {
      list,
      page,
      pageSize,
      total,
      visible,
      isEditProject,
      editProjectItem,
      isLoading,
      userList,
    } = this.state;
    return (
      <Fragment>
        <div className="project-list-content">
          <Title
            title="Projects"
            subTitle="Projects are used to allocate and isolate resources"
            extButtons={[
              <Button type="primary" onClick={this.handleClickCreate}>
                <Translation>New Project</Translation>
              </Button>,
            ]}
          />
          <Table locale={locale.Table} dataSource={list} hasBorder={false} loading={isLoading}>
            {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
          </Table>

          <Pagination
            className="margin-top-20 text-align-right"
            total={total}
            locale={locale.Pagination}
            size="medium"
            pageSize={pageSize}
            current={page}
            onChange={this.handleChange}
          />

          <If condition={visible}>
            <CreateProjectDialog
              visible={visible}
              userList={userList}
              isEditProject={isEditProject}
              editProjectItem={editProjectItem}
              onCreate={this.onCreate}
              onCloseCreate={this.onCloseCreate}
            />
          </If>
        </div>
      </Fragment>
    );
  }
}

export default Projects;
