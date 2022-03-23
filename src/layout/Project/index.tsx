import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import Title from '../../components/ListTitle';
import Translation from '../../components/Translation';
import './index.less';

type Props = {
  activeId: string;
  match: {
    params: {
      projectsName: string;
    };
  };
  dispatch: ({}) => {};
  location: any;
};

@connect((store: any) => {
  return { ...store.project };
})
class ProjectLayout extends Component<Props> {
  componentDidMount() {
    this.loadProjectDetail();
  }

  loadProjectDetail = async () => {
    const { params = { projectsName: '' } } = this.props.match;
    this.props.dispatch({
      type: 'project/getProjectDetails',
      payload: { projectsName: params.projectsName },
    });
  };

  shouldComponentUpdate(nextProps: any) {
    return nextProps.location !== this.props.location;
  }

  getNavList = () => {
    const { params = { projectsName: '' } } = this.props.match;
    const { projectsName } = params;
    const list = [
      {
        id: 'summary',
        name: <Translation>Summary</Translation>,
        to: `/projects/${projectsName}/summary`,
      },
      {
        id: 'applications',
        name: <Translation>Applications</Translation>,
        to: `/projects/${projectsName}/applications`,
      },
    ];
    // {
    //     id: 'roles',
    //     name: <Translation>Roles</Translation>,
    //     to: `/projects/${projectsName}/roles`
    // },
    // {
    //     id: 'members',
    //     name: <Translation>Members</Translation>,
    //     to: `/projects/${projectsName}/members`
    // }];

    const nav = list.map((item) => {
      const active = this.props.activeId === item.id ? 'active' : '';
      return (
        <li className={active}>
          <Link to={item.to}> {item.name}</Link>
        </li>
      );
    });
    return nav;
  };

  render() {
    const menu = this.getNavList();
    return (
      <Fragment>
        <Title title="Projects" subTitle="Projects are used to allocate and isolate resources" />
        <nav className="project-detail-wrapper">
          <ul>{menu}</ul>
        </nav>
        {this.props.children}
      </Fragment>
    );
  }
}

export default ProjectLayout;
