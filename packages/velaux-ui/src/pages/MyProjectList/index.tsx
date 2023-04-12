import { Table, Dialog, Message } from '@alifd/next';
import { Link } from 'dva/router';
import React, { Fragment, Component } from 'react';

import { deleteProject } from '../../api/project';
import { ListTitle as Title } from '../../components/ListTitle';
import { Translation } from '../../components/Translation';
import type { NameAlias } from '../../interface/env';
import type { Project } from '../../interface/project';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';
import { connect } from 'dva';
import { LoginUserInfo } from '../../interface/user';
import i18n from '../../i18n';

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
    ];

    const { Column } = Table;
    const { isLoading } = this.state;
    const { userInfo } = this.props;
    return (
      <Fragment>
        <div className="project-list-content">
          <Title
            title="My Projects"
            subTitle={i18n.t('Project allow isolate the user permissions and applications.')}
          />
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
