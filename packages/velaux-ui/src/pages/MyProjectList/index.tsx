import { Table, Button, Dialog, Message } from '@alifd/next';
import { Link } from 'dva/router';
import React, { Fragment, Component } from 'react';

import { deleteProject } from '../../api/project';
import Title from '../../components/ListTitle';
import Permission from '../../components/Permission';
import Translation from '../../components/Translation';
import type { NameAlias } from '../../interface/env';
import type { Project } from '../../interface/project';
import { momentDate } from '../../utils/common';
import locale from '../../utils/locale';
import { connect } from 'dva';
import { LoginUserInfo } from '../../interface/user';

type Props = {
  dispatch: ({}) => void;
  userInfo?: LoginUserInfo;
};

type State = {
  isLoading: boolean;
};

@connect((store: any) => {
  return { ...store.user };
})
class MyProjectList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
    };
  }
  componentDidMount() {}

  loadUserInfo = () => {
    this.setState({ isLoading: true });
    this.props.dispatch({
      type: 'user/getLoginUserInfo',
      callback: () => {
        this.setState({ isLoading: false });
      },
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
                Message.success(<Translation>Project deleted successfully</Translation>);
                this.loadUserInfo();
              }
            })
            .catch();
        }
      },
      locale: locale().Dialog,
    });
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
        cell: (v: string, i: number, record: Project) => {
          return (
            <Fragment>
              <Permission request={{ resource: `project:${record.name}`, action: 'delete' }} project={`${record.name}`}>
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
    const { isLoading } = this.state;
    const { userInfo } = this.props;
    return (
      <Fragment>
        <div className="project-list-content">
          <Title title="My Projects" subTitle="Showing the all projects that you have permissions" />
          <Table locale={locale().Table} dataSource={userInfo?.projects} loading={isLoading}>
            {columns.map((col, key) => (
              <Column {...col} key={key} align={'left'} />
            ))}
          </Table>
        </div>
      </Fragment>
    );
  }
}

export default MyProjectList;
